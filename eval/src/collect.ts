// Part 2: poll DynamoDB until each ticket is PROCESSED, and classify the outcome.
// The only file that knows how v0 stores tickets.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchGetCommand, BatchGetCommandOutput, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { COLLECT_TIMEOUT_MS, FALLBACK_RESPONSES, POLL_INTERVAL_MS, REGION, TABLE_NAME } from "./config.ts";
import type { Collected, Submission } from "./types.ts";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

// Read up to 100 items in one call. Returns them keyed by id.
export async function batchGet(ids: string[]): Promise<Map<string, Record<string, any>>> {
    const items = new Map<string, Record<string, any>>();
    let keys: Record<string, any>[] | undefined = ids.map((id) => ({ id }));

    // DynamoDB may return some keys as unprocessed (throttling); ask again for those.
    while (keys && keys.length > 0) {
        const res: BatchGetCommandOutput = await ddb.send(
            new BatchGetCommand({
                RequestItems: { [TABLE_NAME!]: { Keys: keys, ConsistentRead: true } },
            }),
        );
        for (const item of res.Responses?.[TABLE_NAME!] ?? []) items.set(item.id, item);
        keys = res.UnprocessedKeys?.[TABLE_NAME!]?.Keys;
    }
    return items;
}

export function toCollected(submission: Submission, item: Record<string, any>): Collected {
    const response: string | undefined = item.analytics?.response;
    const created = Date.parse(item.createdAt);
    const generated = Date.parse(item.analytics?.generatedAt);
    return {
        submission,
        outcome: response && FALLBACK_RESPONSES.includes(response.trim()) ? "fallback" : "processed",
        urgency: item.analytics?.urgency,
        response,
        processingMs: Number.isNaN(created) || Number.isNaN(generated) ? undefined : generated - created,
    };
}

export async function collectAll(submissions: Submission[]): Promise<Collected[]> {
    const results: (Collected | undefined)[] = submissions.map((s) =>
        s.ticketId ? undefined : { submission: s, outcome: "not-submitted" },
    );
    const deadline = Date.now() + COLLECT_TIMEOUT_MS;

    while (true) {
        const pending = submissions
            .map((s, i) => ({ s, i }))
            .filter(({ i }) => results[i] === undefined);
        if (pending.length === 0) break;

        for (let start = 0; start < pending.length; start += 100) {
            const chunk = pending.slice(start, start + 100);
            const items = await batchGet(chunk.map(({ s }) => s.ticketId!));
            for (const { s, i } of chunk) {
                const item = items.get(s.ticketId!);
                if (item?.status === "PROCESSED") results[i] = toCollected(s, item);
            }
        }

        const done = results.filter(Boolean).length;
        process.stdout.write(`\r  collected ${done}/${submissions.length}`);
        if (done === submissions.length) break;
        if (Date.now() > deadline) break;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    process.stdout.write("\n");

    // Whatever is still missing after the deadline is a timeout.
    return results.map((r, i) => r ?? { submission: submissions[i], outcome: "timeout" });
}
