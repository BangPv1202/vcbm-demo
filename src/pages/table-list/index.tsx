import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Tag, Typography } from 'antd';
import {
  EditOutlined,
  LockOutlined,
  MoreOutlined,
  TagOutlined,
} from '@ant-design/icons';
import React, { useMemo, useRef, useState } from 'react';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type TransactionStatus =
  | 'draft'
  | 'pendingVerification'
  | 'pendingApproval'
  | 'approved'
  | 'rejected'
  | 'canceled'
  | 'timeout';

type RefBadge = 'FI' | 'SBV' | undefined;

type RowIcon = 'lock' | 'tag' | 'edit' | undefined;

interface TransactionItem {
  id: string;
  refCode: string; // Mã tham chiếu
  refBadge: RefBadge;
  rowIcon: RowIcon;
  batchCode?: string; // Mã lô
  messageNo: string; // Message No
  transactionDate: string; // Ngày giao dịch (dd/mm/yyyy)
  currency?: 'VND'; // Loại tiền
  amount: number; // Số tiền
  orderAccountNo: string; // Số tài khoản người ra lệnh
  orderAccountName: string; // Tên người ra lệnh
  status: TransactionStatus;
}

// ------------------------------------------------------------------
// Fake data generation (client side, no backend involved)
// ------------------------------------------------------------------

const STATUS_LIST: TransactionStatus[] = [
  'draft',
  'pendingVerification',
  'pendingApproval',
  'approved',
  'rejected',
  'canceled',
  'timeout',
];

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: string }
> = {
  draft: { label: 'Draft', color: 'default' },
  pendingVerification: { label: 'Pending for verification', color: 'gold' },
  pendingApproval: { label: 'Pending for approval', color: 'orange' },
  approved: { label: 'Approved by Vietcombank', color: 'success' },
  rejected: { label: 'Rejected by checker', color: 'error' },
  canceled: { label: 'Canceled', color: 'default' },
  timeout: { label: 'Time-out', color: 'magenta' },
};

const COMPANY_NAMES = [
  'CONG TY CP THIET BI Y TE',
  'CONG TY CP THI CONG XAY DUNG',
  'CONG TY CP THUONG MAI DICH VU',
  'CONG TY TNHH THUC PHAM SACH',
  'CONG TY CP DAU TU XNK',
];

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(): string {
  const day = randomInt(1, 28);
  const month = randomInt(1, 12);
  const year = 2025;
  return `${pad(day)}/${pad(month)}/${year}`;
}

function generateMockData(count: number): TransactionItem[] {
  const data: TransactionItem[] = [];

  for (let i = 0; i < count; i += 1) {
    const seq = 202409100025 - i;
    const status = STATUS_LIST[randomInt(0, STATUS_LIST.length - 1)];
    const refBadgeRoll = Math.random();
    const refBadge: RefBadge =
      refBadgeRoll < 0.35 ? 'FI' : refBadgeRoll < 0.6 ? 'SBV' : undefined;

    const iconRoll = Math.random();
    const rowIcon: RowIcon =
      iconRoll < 0.15
        ? 'lock'
        : iconRoll < 0.35
        ? 'tag'
        : iconRoll < 0.55
        ? 'edit'
        : undefined;

    const hasBatchCode = Math.random() > 0.35;
    const hasCurrency = Math.random() > 0.15;

    data.push({
      id: String(seq),
      refCode: String(seq),
      refBadge,
      rowIcon,
      batchCode: hasBatchCode
        ? `SET02930434${pad(randomInt(0, 99))}`
        : undefined,
      messageNo: `T${randomInt(6000000000, 6999999999)}`,
      transactionDate: randomDate(),
      currency: hasCurrency ? 'VND' : undefined,
      amount: randomInt(50, 3000) * 1000,
      orderAccountNo: '0011291120',
      orderAccountName: COMPANY_NAMES[randomInt(0, COMPANY_NAMES.length - 1)],
      status,
    });
  }

  return data;
}

const MOCK_TOTAL = randomInt(50, 100);
const MOCK_DATA = generateMockData(MOCK_TOTAL);

// ------------------------------------------------------------------
// Small render helpers
// ------------------------------------------------------------------

function RowIconCell({ icon }: { icon: RowIcon }) {
  if (icon === 'lock') return <LockOutlined style={{ color: '#f5222d' }} />;
  if (icon === 'tag') return <TagOutlined style={{ color: '#f5222d' }} />;
  if (icon === 'edit') return <EditOutlined style={{ color: '#8c8c8c' }} />;
  return null;
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<TransactionItem>();
  const [selectedRowsState, setSelectedRows] = useState<TransactionItem[]>([]);

  const intl = useIntl();

  const columns: ProColumns<TransactionItem>[] = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'rowIcon',
        width: 40,
        search: false,
        fixed: 'left',
        render: (_, record) => <RowIconCell icon={record.rowIcon} />,
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Mã tham chiếu" />,
        dataIndex: 'refCode',
        sorter: (a, b) => Number(a.refCode) - Number(b.refCode),
        fixed: 'left',
        width: 200,
        render: (dom, entity) => (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => {
                setCurrentRow(entity);
                setShowDetail(true);
              }}
            >
              {dom}
            </Button>
            {entity.refBadge && <Tag>{entity.refBadge}</Tag>}
          </span>
        ),
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Mã lô" />,
        dataIndex: 'batchCode',
        sorter: (a, b) => (a.batchCode ?? '').localeCompare(b.batchCode ?? ''),
        width: 179,
        render: (_, entity) =>
          entity.batchCode ? (
            <Typography.Link>{entity.batchCode}</Typography.Link>
          ) : (
            '--'
          ),
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Message No" />,
        dataIndex: 'messageNo',
        sorter: (a, b) => a.messageNo.localeCompare(b.messageNo),
        width: 179,
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Ngày giao dịch" />,
        dataIndex: 'transactionDate',
        valueType: 'date',
        width: 146,
        sorter: (a, b) => {
          const [d1, m1, y1] = a.transactionDate.split('/').map(Number);
          const [d2, m2, y2] = b.transactionDate.split('/').map(Number);
          return (
            new Date(y1, m1 - 1, d1).getTime() -
            new Date(y2, m2 - 1, d2).getTime()
          );
        },
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Loại tiền" />,
        dataIndex: 'currency',
        width: 120,
        sorter: (a, b) => (a.currency ?? '').localeCompare(b.currency ?? ''),
        valueEnum: {
          VND: { text: 'VND' },
        },
        render: (_, entity) => entity.currency ?? '--',
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Số tiền" />,
        dataIndex: 'amount',
        width: 155,
        align: 'right',
        sorter: (a, b) => a.amount - b.amount,
        render: (_, entity) => (
          <strong>
            {new Intl.NumberFormat('vi-VN').format(entity.amount)}
          </strong>
        ),
      },
      {
        title: (
          <FormattedMessage
            id="x"
            defaultMessage="Số tài khoản người ra lệnh"
          />
        ),
        dataIndex: 'orderAccountNo',
        sorter: (a, b) => a.orderAccountNo.localeCompare(b.orderAccountNo),
        width: 220,
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Tên người ra lệnh" />,
        dataIndex: 'orderAccountName',
        sorter: (a, b) => a.orderAccountName.localeCompare(b.orderAccountName),
        width: 180,
        ellipsis: true,
      },
      {
        title: <FormattedMessage id="x" defaultMessage="Trạng thái" />,
        dataIndex: 'status',
        fixed: 'right',
        minWidth: 208,
        sorter: (a, b) => a.status.localeCompare(b.status),
        valueEnum: Object.fromEntries(
          Object.entries(STATUS_CONFIG).map(([key, { label }]) => [
            key,
            { text: label },
          ]),
        ),
        render: (_, entity) => {
          const { label, color } = STATUS_CONFIG[entity.status];
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        title: '',
        dataIndex: 'action',
        valueType: 'option',
        hideInForm: true,
        width: 52,
        fixed: 'right',
        render: (_, record: any) => [
          <UpdateForm
            key="config"
            trigger={<MoreOutlined />}
            onOk={actionRef.current?.reload}
            values={record}
          />,
        ],
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <ProTable<TransactionItem>
        headerTitle={intl.formatMessage({
          id: 'x',
          defaultMessage: 'Chuyển tiền trong nước',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <CreateForm key="create" reload={actionRef.current?.reload} />,
        ]}
        // Fake data source: no backend call, sorted/paginated fully on the client.
        request={async (params, sort) => {
          let list = [...MOCK_DATA];

          // local sort
          const sortEntry = Object.entries(sort ?? {}).find(
            ([, order]) => !!order,
          );
          if (sortEntry) {
            const [field, order] = sortEntry as [
              keyof TransactionItem,
              'ascend' | 'descend',
            ];
            const column = columns.find(c => c.dataIndex === field);
            if (column?.sorter && typeof column.sorter === 'function') {
              list.sort((a, b) => (column.sorter as any)(a, b));
              if (order === 'descend') list.reverse();
            }
          }

          const current = params.current ?? 1;
          const pageSize = params.pageSize ?? 20;
          const start = (current - 1) * pageSize;
          const pageData = list.slice(start, start + pageSize);

          return {
            data: pageData,
            success: true,
            total: list.length,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
        scroll={{ x: 1200 }}
      />

      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.refCode && (
          <ProDescriptions<TransactionItem>
            column={2}
            title={currentRow?.refCode}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.refCode,
            }}
            columns={columns as ProDescriptionsItemProps<TransactionItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
