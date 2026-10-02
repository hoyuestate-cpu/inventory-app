#!/bin/sh
# Vercel でのビルド手順。
# - データベースの変更（マイグレーション）は本番デプロイのときだけ行う。
#   プレビュー（取り込み前の変更）で本番のデータベースを書き換えないため。
# - Neon の無料プランはしばらく使わないとデータベースが休止し、起動に数秒かかる。
#   その間に接続が失敗することがあるので、数回やり直す。
set -e

if [ "$VERCEL_ENV" = "production" ]; then
  attempt=1
  until npx prisma migrate deploy; do
    if [ "$attempt" -ge 4 ]; then
      echo "prisma migrate deploy failed after $attempt attempts" >&2
      exit 1
    fi
    echo "prisma migrate deploy failed (attempt $attempt); retrying in $((attempt * 5))s..." >&2
    sleep $((attempt * 5))
    attempt=$((attempt + 1))
  done
else
  echo "Skipping prisma migrate deploy (VERCEL_ENV=${VERCEL_ENV:-unset})"
fi

npx next build
