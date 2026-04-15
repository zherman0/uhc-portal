import React, { useMemo, useState } from 'react';
import { useField } from 'formik';

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  LabelGroup,
  SearchInput,
  Stack,
  StackItem,
  TreeView,
  TreeViewDataItem,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

import type { LogForwardingGroupTreeNode } from '~/components/clusters/wizards/rosa/LogForwarding/logForwardingGroupTreeData';
import { groupSelectedLeavesByRoot } from '~/components/clusters/wizards/rosa/LogForwarding/logForwardingReviewHelpers';
import PopoverHint from '~/components/common/PopoverHint';

export type GroupsApplicationsSelectorProps = {
  /** Formik field name; value is an array of selected leaf node ids. */
  name: string;
  /** Tree of groups and applications (e.g. from API or mocks). */
  treeData: LogForwardingGroupTreeNode[];
  availableTitle?: React.ReactNode;
  chosenTitle?: React.ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
  availableTooltip?: React.ReactNode;
  chosenTooltip?: React.ReactNode;
  listMinHeight?: string;
};

const buildTextById = (node: LogForwardingGroupTreeNode): Record<string, string> => {
  let textById: Record<string, string> = {};
  if (!node) {
    return textById;
  }
  textById[node.id] = node.text;
  if (node.children) {
    node.children.forEach((child) => {
      textById = { ...textById, ...buildTextById(child) };
    });
  }
  return textById;
};

const getDescendantLeafIds = (node: LogForwardingGroupTreeNode): string[] => {
  if (!node.children || !node.children.length) {
    return [node.id];
  }
  let childrenIds: string[] = [];
  node.children.forEach((child) => {
    childrenIds = [...childrenIds, ...getDescendantLeafIds(child)];
  });
  return childrenIds;
};

const getLeavesById = (node: LogForwardingGroupTreeNode): Record<string, string[]> => {
  let leavesById: Record<string, string[]> = {};
  if (!node.children || !node.children.length) {
    leavesById[node.id] = [node.id];
  } else {
    node.children.forEach((child) => {
      leavesById[node.id] = getDescendantLeafIds(node);
      leavesById = { ...leavesById, ...getLeavesById(child) };
    });
  }
  return leavesById;
};

const matchesFilter = (value: string, filter: string) =>
  value.toLowerCase().includes(filter.trim().toLowerCase());

const paneHeading = (label: React.ReactNode, isRequired?: boolean, tooltip?: React.ReactNode) => (
  <Flex
    spaceItems={{ default: 'spaceItemsSm' }}
    alignItems={{ default: 'alignItemsCenter' }}
    flexWrap={{ default: 'nowrap' }}
  >
    <FlexItem>
      {label}
      {isRequired ? <span className="pf-v6-c-form__label-required"> *</span> : null}
    </FlexItem>
    {tooltip ? (
      <FlexItem>
        <PopoverHint hint={tooltip} />
      </FlexItem>
    ) : null}
  </Flex>
);

/** PatternFly LabelGroup replaces `${remaining}` in this string when collapsing overflow labels. */
const LABEL_GROUP_OVERFLOW_PLACEHOLDER = '{remaining}';
const LABEL_GROUP_OVERFLOW_TEXT = `$${LABEL_GROUP_OVERFLOW_PLACEHOLDER} more`;

export function GroupsApplicationsSelector({
  name,
  treeData,
  availableTitle = 'Select groups and applications',
  chosenTitle = 'Selected groups and applications',
  isRequired = false,
  isDisabled = false,
  availableTooltip,
  chosenTooltip,
  listMinHeight = '300px',
}: GroupsApplicationsSelectorProps) {
  const [field, , helpers] = useField<string[]>(name);
  const chosenLeafIds = useMemo(() => field.value ?? [], [field.value]);

  const [treeFilter, setTreeFilter] = useState('');

  const { memoizedLeavesById, memoizedNodeTexts } = useMemo(() => {
    let leavesById: Record<string, string[]> = {};
    let nodeTexts: Record<string, string> = {};
    treeData.forEach((root) => {
      nodeTexts = { ...nodeTexts, ...buildTextById(root) };
      leavesById = { ...leavesById, ...getLeavesById(root) };
    });
    return {
      memoizedLeavesById: leavesById,
      memoizedNodeTexts: nodeTexts,
    };
  }, [treeData]);

  const chosenSet = useMemo(() => new Set(chosenLeafIds), [chosenLeafIds]);

  const treeViewData = useMemo(() => {
    const mapGroupTreeToTreeViewData = (
      nodes: LogForwardingGroupTreeNode[],
      filter: string,
      hasParentMatch: boolean,
    ): TreeViewDataItem[] =>
      nodes.flatMap((node) => {
        const descendentLeafIds = memoizedLeavesById[node.id];
        if (!descendentLeafIds?.length) {
          return [];
        }
        const filterValue = filter.trim();
        const hasMatchingChildren =
          filterValue &&
          descendentLeafIds.some((id) => matchesFilter(memoizedNodeTexts[id], filterValue));
        const isFilterMatch = filterValue && matchesFilter(node.text, filterValue);
        const isDisplayed = !filterValue || hasMatchingChildren || isFilterMatch || hasParentMatch;

        if (!isDisplayed) {
          return node.children?.length
            ? mapGroupTreeToTreeViewData(node.children, filter, hasParentMatch)
            : [];
        }

        const selectedCount = descendentLeafIds.filter((id) => chosenSet.has(id)).length;
        const isParent = !!(node.children && node.children.length > 0);
        let checked: boolean | null = false;
        if (isParent) {
          if (selectedCount === descendentLeafIds.length) checked = true;
          else if (selectedCount > 0) checked = null;
          else checked = false;
        } else {
          checked = chosenSet.has(node.id);
        }

        const item: TreeViewDataItem = {
          id: node.id,
          name: node.text,
          hasBadge: isParent,
          customBadgeContent: isParent ? String(descendentLeafIds.length) : undefined,
          badgeProps: isParent ? { isRead: true } : undefined,
          checkProps: {
            'aria-label': `Select ${node.text}`,
            checked,
            disabled: isDisabled,
          },
          defaultExpanded: !!(filterValue && (hasMatchingChildren || isFilterMatch)),
          children: node.children
            ? mapGroupTreeToTreeViewData(node.children, filter, !!(isFilterMatch || hasParentMatch))
            : undefined,
        };
        return [item];
      });

    return mapGroupTreeToTreeViewData(treeData, treeFilter, false);
  }, [treeData, treeFilter, chosenSet, memoizedLeavesById, memoizedNodeTexts, isDisabled]);

  const selectedByGroup = useMemo(
    () => groupSelectedLeavesByRoot(treeData, chosenLeafIds),
    [treeData, chosenLeafIds],
  );

  const onTreeCheck = (event: React.ChangeEvent<HTMLInputElement>, item: TreeViewDataItem) => {
    const nodeId = item.id;
    if (!nodeId) {
      return;
    }
    const leafIds = memoizedLeavesById[nodeId];
    if (!leafIds?.length) {
      return;
    }
    const { checked } = event.target;
    const next = new Set(chosenLeafIds);
    if (checked) {
      leafIds.forEach((id) => next.add(id));
    } else {
      leafIds.forEach((id) => next.delete(id));
    }
    helpers.setValue(Array.from(next));
    helpers.setTouched(true);
  };

  const removeLeaf = (leafId: string) => {
    helpers.setValue(chosenLeafIds.filter((id) => id !== leafId));
    helpers.setTouched(true);
  };

  const removeGroup = (groupRootId: string) => {
    const leafIds = memoizedLeavesById[groupRootId];
    if (!leafIds?.length) {
      return;
    }
    const drop = new Set(leafIds);
    helpers.setValue(chosenLeafIds.filter((id) => !drop.has(id)));
    helpers.setTouched(true);
  };

  const filterApplied = treeFilter.trim() !== '';
  const showTreeEmpty = filterApplied && treeViewData.length === 0;

  const leftTreePanel = () => {
    if (showTreeEmpty) {
      return (
        <EmptyState
          headingLevel="h4"
          titleText="No results found"
          icon={SearchIcon}
          variant={EmptyStateVariant.sm}
        >
          <EmptyStateBody>
            No results match the filter criteria. Clear all filters and try again.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="link" onClick={() => setTreeFilter('')}>
                Clear all filters
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      );
    }
    return (
      <TreeView
        data={treeViewData}
        hasCheckboxes
        isMultiSelectable
        onCheck={onTreeCheck}
        aria-label={typeof availableTitle === 'string' ? availableTitle : 'Groups and applications'}
      />
    );
  };

  return (
    <FormGroup fieldId={name}>
      <Flex
        direction={{ default: 'row' }}
        flexWrap={{ default: 'nowrap' }}
        spaceItems={{ default: 'spaceItemsLg' }}
        alignItems={{ default: 'alignItemsFlexStart' }}
      >
        <FlexItem flex={{ default: 'flex_1' }}>
          <Stack hasGutter>
            <StackItem>{paneHeading(availableTitle, isRequired, availableTooltip)}</StackItem>
            <StackItem>
              <SearchInput
                value={treeFilter}
                onChange={(_event, value) => setTreeFilter(value)}
                onClear={() => setTreeFilter('')}
                isDisabled={isDisabled}
              />
            </StackItem>
            <StackItem>
              <div style={{ minHeight: listMinHeight, overflow: 'auto' }}>{leftTreePanel()}</div>
            </StackItem>
          </Stack>
        </FlexItem>

        <FlexItem flex={{ default: 'flex_1' }}>
          <Stack hasGutter>
            <StackItem>{paneHeading(chosenTitle, isRequired, chosenTooltip)}</StackItem>
            <StackItem>
              <div
                className="pf-v6-u-p-md"
                style={{
                  minHeight: listMinHeight,
                  border: '1px solid var(--pf-v6-global--BorderColor--100)',
                  borderRadius: 'var(--pf-v6-global--BorderRadius--medium)',
                  overflow: 'auto',
                }}
              >
                {chosenLeafIds.length === 0 ? (
                  <EmptyState headingLevel="h4" titleText="" variant={EmptyStateVariant.sm}>
                    <EmptyStateBody>No groups or applications selected</EmptyStateBody>
                  </EmptyState>
                ) : (
                  <Stack hasGutter>
                    {selectedByGroup.map(({ groupRootId, groupLabel, leaves }) => (
                      <div key={groupRootId} style={{ minWidth: 0 }}>
                        <LabelGroup
                          categoryName={groupLabel}
                          numLabels={8}
                          collapsedText={LABEL_GROUP_OVERFLOW_TEXT}
                          isClosable={!isDisabled}
                          closeBtnAriaLabel={`Remove all applications in ${groupLabel}`}
                          onClick={() => removeGroup(groupRootId)}
                        >
                          {leaves.map(({ id, text }) => (
                            <Label
                              key={id}
                              variant="filled"
                              onClose={
                                isDisabled
                                  ? undefined
                                  : (e) => {
                                      e.stopPropagation();
                                      removeLeaf(id);
                                    }
                              }
                              closeBtnAriaLabel={`Remove ${text}`}
                            >
                              {text}
                            </Label>
                          ))}
                        </LabelGroup>
                      </div>
                    ))}
                  </Stack>
                )}
              </div>
            </StackItem>
          </Stack>
        </FlexItem>
      </Flex>
    </FormGroup>
  );
}
