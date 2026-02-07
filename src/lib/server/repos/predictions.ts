import { getDbPool } from "../db";
import { newUuid } from "../auth";

export type CreatePredictionInput = {
  userId: string;
  dailyLogId?: string | null;
  modelName: string;
  modelVersion: string;
  riskLevel: string;
  riskScore: number;
  featuresEncrypted?: Buffer | null;
  explanationEncrypted?: Buffer | null;
};

export type DbPrediction = {
  id: string;
  user_id: string;
  daily_log_id: string | null;
  model_name: string;
  model_version: string;
  risk_level: string;
  risk_score: string;
  created_at: string;
};

export async function createPrediction(input: CreatePredictionInput): Promise<DbPrediction> {
  const pool = getDbPool();
  const id = newUuid();

  const res = await pool.query<DbPrediction>(
    `INSERT INTO predictions (
        id, user_id, daily_log_id,
        model_name, model_version,
        risk_level, risk_score,
        features_encrypted, explanation_encrypted
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, user_id, daily_log_id, model_name, model_version, risk_level, risk_score, created_at`,
    [
      id,
      input.userId,
      input.dailyLogId ?? null,
      input.modelName,
      input.modelVersion,
      input.riskLevel,
      input.riskScore,
      input.featuresEncrypted ?? null,
      input.explanationEncrypted ?? null,
    ]
  );

  return res.rows[0]!;
}
