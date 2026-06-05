#!/bin/zsh
set -e

# ============================================================
# cloud-attach 部署脚本
# 用法：
#   ./deploy.sh            # 默认：开发模式（dev），commit + push，不打 tag
#   ./deploy.sh --release  # 发布模式：commit + push + 更新版本号 + 打 tag
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ----------------------------------------------------------
# 解析参数
# ----------------------------------------------------------
MODE="dev"  # 默认开发模式

for arg in "$@"; do
  case $arg in
    --release)
      MODE="release"
      shift
      ;;
    --dev)
      MODE="dev"
      shift
      ;;
  esac
done

echo "==> 模式: $MODE"

# ----------------------------------------------------------
# 1. 版本号处理
# ----------------------------------------------------------
CURRENT_VERSION=$(node -e "console.log(require('./manifest.json').version)")
VERSION="$CURRENT_VERSION"

if [ "$MODE" = "release" ]; then
  # 发布模式：自动版本号 +1（最后一位）
  VERSION_PARTS=(${(s:.:)CURRENT_VERSION})
  VERSION_PARTS[3]=$((${VERSION_PARTS[3]} + 1))
  VERSION="${VERSION_PARTS[1]}.${VERSION_PARTS[2]}.${VERSION_PARTS[3]}"
  
  echo "==> 版本: $CURRENT_VERSION → $VERSION"
  
  # 更新 manifest.json
  node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('manifest.json','utf8'));
  m.version = '$VERSION';
  fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\n');
  "
else
  echo "==> 版本: $VERSION (开发模式，不更新版本号)"
fi

# ----------------------------------------------------------
# 2. Git 提交 & 推送
# ----------------------------------------------------------
echo "==> Git 提交"

if [ "$MODE" = "release" ]; then
  git add .
  git commit -m "release: $VERSION"
else
  git add .
  git commit -m "dev: $VERSION"
fi

echo "==> Git 推送"
git push || echo "⚠️  Git 推送失败，继续执行..."

# ----------------------------------------------------------
# 3. 创建 tag（仅发布模式）
# ----------------------------------------------------------
if [ "$MODE" = "release" ]; then
  echo "==> 创建并推送 tag: $VERSION"
  git tag -a "$VERSION" -m "release: $VERSION" && git push origin "$VERSION" || echo "⚠️  Tag 推送失败，继续执行..."
else
  echo "==> [跳过] 开发模式不创建 tag"
fi

# ----------------------------------------------------------
# 4. GitHub Release（仅发布模式，由 GitHub Actions 自动处理）
# ----------------------------------------------------------
if [ "$MODE" = "release" ]; then
  echo "==> GitHub Actions 将自动创建 Release"
  echo "   查看进度: https://github.com/curryhendry/obsidian-cloud-attach/actions"
else
  echo "==> [跳过] 开发模式不触发 GitHub Actions"
fi

echo ""
echo "==> 完成！"
echo "    模式: $MODE"
echo "    版本: $VERSION"
if [ "$MODE" = "dev" ]; then
  echo "    💡 提示: 使用 ./deploy.sh --release 发布正式版本"
fi
