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
# 从 CHANGELOG.md 首行读取版本号（使用 Node.js 解析，更可靠）
# 格式：## v0.3.101.dev - 2026-06-08
CURRENT_VERSION=$(node -e "
  const fs = require('fs');
  const firstLine = fs.readFileSync('CHANGELOG.md', 'utf8').split('\n')[0];
  const match = firstLine.match(/v([\d.]+)/);
  if (match) console.log(match[1]);
")

echo "==> 当前版本: $CURRENT_VERSION"

# 递增 PATCH 版本号
VERSION=$(node -e "
  const v = '$CURRENT_VERSION'.split('.');
  const patch = parseInt(v[2], 10) + 1;
  console.log(v[0] + '.' + v[1] + '.' + String(patch).padStart(3, '0'));
")

echo "==> 新版本: $VERSION"

if [ "$MODE" = "release" ]; then
  echo "==> 版本: $CURRENT_VERSION → $VERSION"
  
  # 更新 manifest.json
  node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('manifest.json','utf8'));
  m.version = '$VERSION';
  fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\n');
  "
  
  # 更新 CHANGELOG.md 首行
  sed -i.bak "1s/.*/## v$VERSION - $(date +%Y-%m-%d)/" CHANGELOG.md
  rm -f CHANGELOG.md.bak
else
  # dev 模式：版本号 + .dev 后缀
  DEV_VERSION="${VERSION}.dev"
  echo "==> 版本: $CURRENT_VERSION → $DEV_VERSION (开发模式)"
  
  # 更新 CHANGELOG.md 首行
  sed -i.bak "1s/.*/## v$DEV_VERSION - $(date +%Y-%m-%d)/" CHANGELOG.md
  rm -f CHANGELOG.md.bak
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
  # dev 模式：打 .dev tag
  DEV_TAG="${VERSION}.dev"
  echo "==> 创建并推送 dev tag: $DEV_TAG"
  git tag -a "$DEV_TAG" -m "dev: $VERSION" && git push origin "$DEV_TAG" || echo "⚠️  Dev tag 推送失败，继续执行..."
fi

# ----------------------------------------------------------
# 4. 同步到 Obsidian 插件目录
# ----------------------------------------------------------
OBSIDIAN_PLUGIN_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/curryhendry/.obsidian/plugins/cloud-attach"
if [ -d "$OBSIDIAN_PLUGIN_DIR" ]; then
  echo "==> 同步 main.js 到 Obsidian 插件目录"
  cp "$SCRIPT_DIR/main.js" "$OBSIDIAN_PLUGIN_DIR/main.js"
else
  echo "⚠️  Obsidian 插件目录不存在: $OBSIDIAN_PLUGIN_DIR"
fi

# ----------------------------------------------------------
# 5. GitHub Release（仅发布模式，由 GitHub Actions 自动处理）
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
