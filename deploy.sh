#!/bin/bash
set -e

# 脚本自身所在目录作为项目根目录，兼容任意路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 自动版本号：v0.1.{3位补零的commit_count}
COUNT=$(git rev-list --count HEAD)
VERSION="v0.1.$(printf '%03d' $COUNT)"
MANIFEST="manifest.json"

echo "==> 更新 manifest.json 版本为 $VERSION"
node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('$MANIFEST','utf8'));
m.version = '$VERSION';
fs.writeFileSync('$MANIFEST', JSON.stringify(m, null, 2) + '\n');
"

echo "==> 提交代码"
git add .
git commit -m "release: $VERSION"

echo "==> 打 tag: $VERSION"
git tag -f "$VERSION"

echo "==> 推送到远程"
git push && git push origin "$VERSION"

echo ""
echo "==> 完成，版本 $VERSION 已发布"
