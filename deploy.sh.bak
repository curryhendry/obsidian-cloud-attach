#!/bin/bash
set -e

# ============================================================
# cloud-attach 部署脚本
# 功能：
#   1. 自动版本号
#   2. Git 提交 & 推送
#   3. 同步到 Obsidian 插件目录（iCloud）
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ----------------------------------------------------------
# 1. 自动版本号
# ----------------------------------------------------------
# 手动指定版本号（可选）
VERSION=${VERSION:-}
if [ -z "$VERSION" ]; then
  COUNT=$(git rev-list --count HEAD)
  VERSION="v0.1.$(printf "%03d" $COUNT)"
fi
VERSION="v0.1.$(printf '%03d' $COUNT)"

echo "==> 版本: $VERSION"

# 更新 manifest.json
node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('manifest.json','utf8'));
m.version = '$VERSION';
fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\n');
"

# ----------------------------------------------------------
# 2. Git 提交 & 推送
# ----------------------------------------------------------
echo "==> Git 提交"
git add .
git commit -m "release: $VERSION"

echo "==> Git 推送"
git push || echo "⚠️  Git 推送失败，继续执行..."

echo "==> 创建并推送 tag"
git tag -a "$VERSION" -m "release: $VERSION" && git push origin "$VERSION" || echo "⚠️  Tag 推送失败，继续执行..."

# ----------------------------------------------------------
# 3. 同步到 Obsidian 插件目录（iCloud）
# ----------------------------------------------------------
echo "==> 同步到 Obsidian 插件目录..."

# 查找 iCloud Obsidian vault 中的 cloud-attach 插件目录
# 支持不同 Mac 的路径格式
find_icloud_plugin_dir() {
    local vault_name="curryhendry"
    
    # 尝试多种可能的 iCloud 路径格式
    local search_paths=(
        "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/$vault_name/.obsidian/plugins/cloud-attach"
        "$HOME/Library/MobileDocuments/iCloud~md~obsidian/Documents/$vault_name/.obsidian/plugins/cloud-attach"
    )
    
    for path in "${search_paths[@]}"; do
        if [ -d "$(dirname "$path")" ]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

PLUGIN_DIR=$(find_icloud_plugin_dir)

if [ -z "$PLUGIN_DIR" ] || [ ! -d "$(dirname "$PLUGIN_DIR")" ]; then
    echo "⚠️  未找到 Obsidian 插件目录，跳过同步"
    echo "   提示：请确保已在此电脑打开过 Obsidian 并启用 cloud-attach 插件"
else
    echo "   目标: $PLUGIN_DIR"
    
    # 确保目录存在
    mkdir -p "$PLUGIN_DIR"
    
    # 复制 main.js 和 manifest.json（保留 data.json 不动）
    cp "$SCRIPT_DIR/main.js" "$PLUGIN_DIR/"
    cp "$SCRIPT_DIR/manifest.json" "$PLUGIN_DIR/"
    
    echo "   ✓ 已同步 main.js 和 manifest.json"
    echo "   ✓ data.json 保持不变"
    
fi

echo ""
echo "==> 完成！版本 $VERSION"
