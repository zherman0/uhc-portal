import type { LogForwardingGroupTreeNode } from './logForwardingGroupTreeData';

export type LogForwardingSelectedByGroup = {
  groupLabel: string;
  applicationLabels: string[];
};

export type LogForwardingSelectedLeavesGroup = {
  groupRootId: string;
  groupLabel: string;
  leaves: { id: string; text: string }[];
};

/** All descendant leaf nodes (nodes with no children) under `node`. */
function getLeafDescendants(node: LogForwardingGroupTreeNode): LogForwardingGroupTreeNode[] {
  if (!node.children?.length) {
    return [node];
  }
  return node.children.flatMap((child) => getLeafDescendants(child));
}

/** Groups selected leaves (id + label) under each top-level tree node. */
export function groupSelectedLeavesByRoot(
  tree: LogForwardingGroupTreeNode[],
  selectedIds: string[],
): LogForwardingSelectedLeavesGroup[] {
  const idSet = new Set(selectedIds);
  const result: LogForwardingSelectedLeavesGroup[] = [];

  tree.forEach((root) => {
    const leaves = getLeafDescendants(root);
    const selectedLeaves = leaves.filter((leaf) => idSet.has(leaf.id));
    if (selectedLeaves.length) {
      result.push({
        groupRootId: root.id,
        groupLabel: root.text,
        leaves: selectedLeaves.map((leaf) => ({ id: leaf.id, text: leaf.text })),
      });
    }
  });

  return result;
}

/** Groups selected leaf ids under each top-level tree node for review display. */
export function groupSelectedLogForwardingItems(
  tree: LogForwardingGroupTreeNode[],
  selectedIds: string[],
): LogForwardingSelectedByGroup[] {
  return groupSelectedLeavesByRoot(tree, selectedIds).map(({ groupLabel, leaves }) => ({
    groupLabel,
    applicationLabels: leaves.map((leaf) => leaf.text),
  }));
}
