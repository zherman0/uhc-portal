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

/** Leaves under a wizard root: log-forwarding trees are group → apps (depth ≤ 2), never deeper. */
function getLeafDescendants(node: LogForwardingGroupTreeNode): LogForwardingGroupTreeNode[] {
  return node.children?.length ? node.children : [node];
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
