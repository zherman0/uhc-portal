export type LogForwardingGroupTreeNode = {
  id: string;
  text: string;
  children?: LogForwardingGroupTreeNode[];
};

/** Test and Storybook fixture; not from the API. */
export const mockLogForwardingGroupTree: LogForwardingGroupTreeNode[] = [
  {
    id: 'api',
    text: 'API',
    children: [
      { id: 'api-audit', text: 'audit' },
      { id: 'api-server', text: 'apiserver' },
    ],
  },
  {
    id: 'authentication',
    text: 'Authentication',
    children: [
      { id: 'auth-kube-apiserver', text: 'kube-apiserver' },
      { id: 'auth-konnectivity-agent', text: 'konnectivity-agent' },
    ],
  },
  {
    id: 'controller-manager',
    text: 'Controller manager',
  },
  {
    id: 'ungrouped-applications',
    text: 'Ungrouped applications',
    children: [{ id: 'sample-app', text: 'sample-application' }],
  },
];
