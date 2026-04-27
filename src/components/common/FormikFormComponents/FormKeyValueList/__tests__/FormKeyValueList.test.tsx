import React from 'react';
import { Formik, FormikValues } from 'formik';

import { FieldId } from '~/components/clusters/wizards/common/constants';
import { checkAccessibility, render, screen } from '~/testUtils';

import FormKeyValueList from '../FormKeyValueList';

const push = jest.fn();
const remove = jest.fn();

type NodeLabelRow = { key: string; value: string };

describe('<FormKeyValueList />', () => {
  const listWithItemsFields: NodeLabelRow[] = [
    { key: 'aa', value: 'bb' },
    { key: 'cc', value: 'dd' },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  const ConnectedKeyValueList = ({ fields = [] }: { fields?: NodeLabelRow[] }) => (
    <Formik<FormikValues>
      initialValues={{
        [FieldId.NodeLabels]: fields,
      }}
      onSubmit={() => {}}
    >
      <FormKeyValueList push={push} remove={remove} />
    </Formik>
  );

  it('is accessible', async () => {
    const { container } = render(<ConnectedKeyValueList />);

    await checkAccessibility(container);
  });

  it('displays one input set when no field items are passed', async () => {
    render(<ConnectedKeyValueList />);

    expect(await screen.findByLabelText('Key-value list key')).toBeInTheDocument();
    expect(await screen.findByLabelText('Key-value list value')).toBeInTheDocument();
  });

  it('has same number of input sets as field items', () => {
    render(<ConnectedKeyValueList fields={listWithItemsFields} />);

    const keyFields = screen.getAllByLabelText('Key-value list key');
    const valueFields = screen.getAllByLabelText('Key-value list value');

    expect(keyFields).toHaveLength(listWithItemsFields.length);
    expect(valueFields).toHaveLength(listWithItemsFields.length);
  });

  it('calls push function when adding a new item', async () => {
    const { user } = render(<ConnectedKeyValueList fields={listWithItemsFields} />);
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Add additional label' }));

    expect(push).toHaveBeenCalled();
  });

  it('calls remove function when removing an item', async () => {
    const { user } = render(<ConnectedKeyValueList fields={listWithItemsFields} />);
    expect(remove).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: 'Remove item' })[0]);

    expect(remove).toHaveBeenCalled();
  });
});
