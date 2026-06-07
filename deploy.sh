#!/bin/zsh
set -e

# ============================================================
# cloud-attach 部署脚本
# 用法：
#   ./deploy.sh            # 默认：开发模式（dev），不更新 manifest.json，打 .dev tag，同步插件
#   ./deploy.sh --release  # 发布模式：更新 manifest.json，打正式 tag，不同步插件
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
PLUGIN_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/curryhendry/.obsidian/plugins/cloud-attach"
MANIFEST_JSON="manifest.json"
CHANGELOG_MD="CHANGELOG.md"

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
CURRENT_VERSION=$(node -e "console.log(require('./${MANIFEST_JSON}').version)")
echo "==> 当前版本: $CURRENT_VERSION"

# 递增版本号（PATCH +1，强制十进制避免八进制错误）
VERSION_PARTS=("${(@s:.:)CURRENT_VERSION}")
VERSION_PARTS[3]=$((${VERSION_PARTS[3]} + 1))
NEW_VERSION="${VERSION_PARTS[1]}.${VERSION_PARTS[2]}.${VERSION_PARTS[3]}"

echo "==> 新版本: $NEW_VERSION"

# ----------------------------------------------------------
# 2. 更新 manifest.json（仅 release 模式）
# ----------------------------------------------------------
if [ "$MODE" = "release" ]; then
  echo "==> 更新 ${MANIFEST_JSON}: $NEW_VERSION"
  node -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('${MANIFEST_JSON}','utf8'));
  m.version = '$NEW_VERSION';
  fs.writeFileSync('${MANIFEST_JSON}', JSON.stringify(m, null, 2) + '\n');
  "
else
  echo "==> [跳过] 开发模式不更新 ${MANIFEST_JSON}"
fi

# ----------------------------------------------------------
# 3. 更新 CHANGELOG.md（顶部插入新条目）
# ----------------------------------------------------------
TODAY=$(date +"%Y-%m-%d")
if [ "$MODE" = "release" ]; then
  ENTRY="## v${NEW_VERSION} - ${TODAY}\n\n### 修复\n- （待补充）\n\n"
else
  ENTRY="## v${NEW_VERSION}.dev - ${TODAY}\n\n### 修复\n- （待补充）\n\n"
fi

echo "==> 更新 ${CHANGELOG_MD}"
node -e "
const fs = require('fs');
const content = fs.readFileSync('${CHANGELOG_MD}','utf8');
const entry = '$ENTRY'.replace(/\\\\n/g, '\n');
fs.writeFileSync('${CHANGELOG_MD}', entry + content);
"

# ----------------------------------------------------------
# 4. 构建
# ----------------------------------------------------------
echo "==> 构建"
if [ -f "package.json" ]; then
  npm run build
fi

# ----------------------------------------------------------
# 5. Git 提交 & 推送
# ----------------------------------------------------------
echo "==> Git 提交"

if [ "$MODE" = "release" ]; then
  git add ${MANIFEST_JSON} ${CHANGELOG_MD} main.js src/main.js
  git commit -m "release: $NEW_VERSION"
else
  git add ${CHANGELOG_MD} main.js src/main.js
  git commit -m "dev: $NEW_VERSION"
fi

echo "==> Git 推送"
git push || echo "⚠️  Git 推送失败，继续执行..."

# ----------------------------------------------------------
# 6. 创建 tag（tag 不带 v 前缀）
# ----------------------------------------------------------
if [ "$MODE" = "release" ]; then
  echo "==> 创建并推送正式 tag: $NEW_VERSION"
  git tag -a "$NEW_VERSION" -m "release: $NEW_VERSION" && git push origin "$NEW_VERSION" || echo "⚠️  Tag 推送失败，继续执行..."
  echo "==> GitHub Actions 将自动创建 Release"
  echo "   查看进度: https://github.com/curryhendry/obsidian-cloud-attach/actions"
else
  # dev 模式：打 .dev tag（不带 v 前缀）
  DEV_TAG="${NEW_VERSION}.dev"
  echo "==> 创建并推送 dev tag: $DEV_TAG"
  git tag -a "$DEV_TAG" -m "dev: $NEW_VERSION" && git push origin "$DEV_TAG" || echo "⚠️  Dev tag 推送失败，继续执行..."
fi

# ----------------------------------------------------------
# 7. 同步到 Obsidian 插件目录（仅 dev 模式）
# ----------------------------------------------------------
if [ "$MODE" = "dev" ]; then
  if [[ -d "$PLUGIN_DIR" ]]; then
    cp main.js "$PLUGIN_DIR/"
    [[ -f styles.css ]] && cp styles.css "$PLUGIN_DIR/"
    echo "✅ 已同步到 Obsidian 插件目录: $PLUGIN_DIR"
  else
    echo "⚠️  Obsidian 插件目录不存在: $PLUGIN_DIR"
  fi
else
  echo "==> [跳过] 发布模式不同步到 Obsidian 插件目录"
fi

echo ""
echo "==> 完成！"
echo "    模式: $MODE"
echo "    版本: $NEW_VERSION"
if [ "$MODE" = "dev" ]; then
  echo "    💡 提示: 使用 ./deploy.sh --release 发布正式版本"
fi
