import { EmptyState } from '../feedback/EmptyState';
import type { DataTableColumn } from '@/types';

export interface DataTableProps<Row = Record<string, any>> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  caption?: string;
  rowKey?: (row: Row) => string;
}

export function DataTable<Row extends Record<string, any> = Record<string, any>>({
  columns,
  rows,
  caption = 'Data table',
  rowKey = (row) => String(row.id),
}: DataTableProps<Row>) {
  if (!rows.length) return <EmptyState title="No records found" />;
  return (
    <div className="table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
