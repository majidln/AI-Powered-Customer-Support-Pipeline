# Results

Evaluation: the fixed ticket set from Step 0, submitted through the deployed API. Region `us-east-1`, Node.js on `nodejs24.x`, DynamoDB on demand, HTTP API.

The evaluation set is frozen. Later steps re-run it unchanged and add a row here. A label is changed only to fix a mistake, and that fix is noted under the step where it happened.

## Summary

One row per step. Targets are in [PLANNING.md §1.4](PLANNING.md#14-success-criteria).

| Step | What changed | Model | Urgency accuracy | CRITICAL recall | Grounded replies | Red-team passed | p95 latency | Cost / ticket |
|---|---|---|---|---|---|---|---|---|
| v0 | Baseline | Nova Lite | | | | | | |
| 1 | Reliability | | | | | | | |
| 2 | Converse API, structured output | | | | | | | |
| 3 | Guardrails and security | | | | | | | |
| 4 | Knowledge Base grounding | | | | | | | |
| 5 | Model comparison | | | | | | | |

- *Targets:* accuracy ≥ 90%, CRITICAL recall ≥ 95%, grounded replies ≥ 90% with 0 invented policies, p95 < 30 s, < $0.01 per ticket.

## Contents

- [Step 0: baseline (v0)](#step-0-baseline-v0)
- [Step 1: reliability](#step-1-reliability)
- [Step 2: structured output](#step-2-structured-output)
- [Step 3: guardrails and security](#step-3-guardrails-and-security)
- [Step 4: Knowledge Base grounding](#step-4-knowledge-base-grounding)
- [Step 5: model comparison](#step-5-model-comparison)

---

## Step 0: baseline (v0)

### Predictions

Written down on 2026-10-22, before the first run.

| Metric | Predicted | Actual |
|---|---|---|
| Urgency accuracy | 38 / 42 | |
| CRITICAL recall | 8 / 8 | |
| Replies with an invented policy | 3 | |
| Red-team tickets passed | 0 / 7 | |

**Environment**

- Commit / tag:
- Evaluation set: N tickets (LOW / MEDIUM / HIGH / CRITICAL / red-team counts)
- Model and inference settings:

### Urgency

Confusion matrix, expected vs. predicted:

| expected ↓ / predicted → | LOW | MEDIUM | HIGH | CRITICAL |
|---|---|---|---|---|
| LOW | | | | |
| MEDIUM | | | | |
| HIGH | | | | |
| CRITICAL | | | | |

### Replies

| Metric | Value |
|---|---|
| Judged correct | |
| Invented policies or promises | |
| Red-team tickets handled correctly | |

### Latency and cost

| Metric | p50 | p95 | max |
|---|---|---|---|
| Submit → `202` | | | |
| Submit → draft available | | | |

| Tokens in (avg) | Tokens out (avg) | Cost / ticket |
|---|---|---|
| | | |

### Step 0 findings

-

---

## Step 1: reliability

### Failure proofs

| Proof | Result |
|---|---|
| Forced Bedrock failure → retry → DLQ → alarm | |
| Poisoned record in a batch of 10, the other 9 processed exactly once | |
| `404` for an unknown ticket, `400` for malformed JSON | |

### Step 1 findings

-

---

## Step 2: structured output

### Step 2 findings

-

---

## Step 3: guardrails and security

### Red-team results

| Ticket | Attack | Expected | Result |
|---|---|---|---|
| | | | |

### Step 3 findings

-

---

## Step 4: Knowledge Base grounding

### Chunking comparison

| Strategy | Grounded replies | Invented policies | Cost / ticket |
|---|---|---|---|
| | | | |

### Step 4 findings

-

---

## Step 5: model comparison

| Model | Urgency accuracy | CRITICAL recall | Reply quality | p95 latency | Cost / ticket |
|---|---|---|---|---|---|
| Nova Lite | | | | | |
| Nova Pro | | | | | |
| Claude Haiku | | | | | |

**Decision:**

### Step 5 findings

-
