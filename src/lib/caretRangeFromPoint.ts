export function caretRangeFromPoint(element: HTMLElement, x: number, y: number): CaretPositionOffset | null {
    // テキストノードを取得する関数
    function getTextNodes(node: Node) {
        let textNodes: Text[] = [];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodes.push(node as Text);
        } else {
            for (const childNode of Array.from(node.childNodes)) {
                textNodes = textNodes.concat(getTextNodes(childNode));
            }
        }
        return textNodes;
    }

    // 対象要素のテキストノードを取得
    const textNodes = getTextNodes(element);

    // セレクションオブジェクトを取得
    const selection = window.getSelection();
    if (selection === null) throw new Error('???');

    let closestTextNode: Node | null = null;
    let closestOffset = 0;
    let minDistance = Infinity;

    // 座標に最も近いテキストノードとオフセットを見つける
    for (const textNode of textNodes) {
        for (let i = 0; i < textNode.length; i++) {
            selection?.removeAllRanges();
            const range = document.createRange();
            range.setStart(textNode, i);
            selection.addRange(range);
            const rangeRect = selection.getRangeAt(0).getBoundingClientRect();

            // 座標とテキスト位置の距離を計算
            const dx = x - (rangeRect.left + rangeRect.right) / 2;
            const dy = y - (rangeRect.top + rangeRect.bottom) / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 最も近いテキスト位置を更新
            if (distance < minDistance) {
                closestTextNode = textNode;
                closestOffset = i;
                minDistance = distance;
            }
        }
    }

    if (closestTextNode === null) return null;

    return {
        offsetNode: closestTextNode,
        offset: closestOffset,
    };
}

export interface CaretPositionOffset {
    offsetNode: Node;
    offset: number;
}
