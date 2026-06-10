<!-- filepath: /Users/yogann-henry/Documents/Develop/EMN/EmnWard/src/common/components/ui/table/EMTableExample.vue -->
<template>
  <div class="table-example-page">
    <h1>EMTable Component Examples</h1>

    <!-- ===================================
      * Basic Usage Example
      * =================================== -->
    <section class="example-section">
      <h2>Basic Usage</h2>
      <p>Simple table with sorting and actions</p>

      <EMTable
        :data="users"
        :columns="columns"
        :actions="actions"
        row-key="id"
        aria-label="Users table"
        @action="handleAction"
        @sort="handleSort"
      />
    </section>

    <!-- ===================================
      * Custom Cell Rendering
      * =================================== -->
    <section class="example-section">
      <h2>Custom Cell Rendering</h2>
      <p>Using slots to customize cell content</p>

      <EMTable
        :data="users"
        :columns="columnsWithCustom"
        :actions="actions"
        row-key="id"
        aria-label="Users table with custom cells"
        @action="handleAction"
      >
        <!-- Custom status cell with badge -->
        <template #cell-status="{ value }">
          <span
            class="status-badge"
            :class="{
              'status-active': value === 'active',
              'status-inactive': value === 'inactive',
              'status-pending': value === 'pending',
            }"
          >
            {{ value }}
          </span>
        </template>

        <!-- Custom avatar cell -->
        <template #cell-name="{ row }">
          <div class="user-cell">
            <div class="user-avatar">
              {{ getInitials(row.name as string) }}
            </div>
            <span>{{ row.name }}</span>
          </div>
        </template>
      </EMTable>
    </section>

    <!-- ===================================
      * Custom Styling Example
      * =================================== -->
    <section class="example-section">
      <h2>Custom Styling</h2>
      <p>Using customClasses and customStyles props</p>

      <EMTable
        :data="users"
        :columns="columns"
        :actions="actions"
        :custom-classes="customClasses"
        :custom-styles="customStyles"
        row-key="id"
        aria-label="Styled users table"
        @action="handleAction"
      />
    </section>

    <!-- ===================================
      * Without Actions Column
      * =================================== -->
    <section class="example-section">
      <h2>Read-only Table (No Actions)</h2>
      <p>Table without actions column</p>

      <EMTable
        :data="users"
        :columns="columns"
        :show-actions-column="false"
        row-key="id"
        aria-label="Read-only users table"
        @sort="handleSort"
      />
    </section>

    <!-- ===================================
      * Empty State
      * =================================== -->
    <section class="example-section">
      <h2>Empty State</h2>
      <p>Custom empty message slot</p>

      <EMTable
        :data="[]"
        :columns="columns"
        :actions="actions"
        row-key="id"
        aria-label="Empty table"
      >
        <template #empty>
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No users found</p>
            <button @click="loadUsers">Load Sample Data</button>
          </div>
        </template>
      </EMTable>
    </section>

    <!-- Action Result Display -->
    <div v-if="lastAction" class="action-result">
      <strong>Last Action:</strong> {{ lastAction.action.label }} on "{{ lastAction.row.name }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import EMTable from './EMTable.vue';
import type {
  ColumnDefinition,
  TableAction,
  TableCustomClasses,
  TableCustomStyles,
  ActionPayload,
  SortPayload,
} from './types';

// ===================================
// Types
// ===================================

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

// ===================================
// Sample Data
// ===================================

const users = ref<User[]>([
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'active',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Viewer',
    status: 'inactive',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@example.com',
    role: 'Editor',
    status: 'pending',
    createdAt: new Date('2024-04-05'),
  },
  {
    id: 5,
    name: 'Edward Norton',
    email: 'edward@example.com',
    role: 'Viewer',
    status: 'active',
    createdAt: new Date('2024-05-12'),
  },
]);

// ===================================
// Column Definitions
// ===================================

const columns: ColumnDefinition<User>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    minWidth: '150px',
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    minWidth: '200px',
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    width: '100px',
    align: 'center',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '100px',
    align: 'center',
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    width: '120px',
    formatter: (value) => {
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return String(value);
    },
  },
];

const columnsWithCustom: ColumnDefinition<User>[] = [
  {
    key: 'name',
    label: 'User',
    sortable: true,
    minWidth: '200px',
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    minWidth: '200px',
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    width: '100px',
    align: 'center',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '120px',
    align: 'center',
  },
];

// ===================================
// Actions Definition
// ===================================

const actions: TableAction<User>[] = [
  {
    key: 'view',
    label: 'View Details',
    icon: '👁️',
    handler: (row) => {
      alert(`Viewing details for: ${row.name}`);
    },
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: '✏️',
    handler: (row) => {
      alert(`Editing: ${row.name}`);
    },
  },
  {
    key: 'duplicate',
    label: 'Duplicate',
    icon: '📋',
    disabled: (row) => row.status === 'pending',
    handler: (row) => {
      const newUser: User = {
        ...row,
        id: Date.now(),
        name: `${row.name} (Copy)`,
      };
      users.value.push(newUser);
    },
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: '🗑️',
    danger: true,
    disabled: (row) => row.role === 'Admin',
    handler: (row, rowIndex) => {
      if (confirm(`Are you sure you want to delete ${row.name}?`)) {
        users.value = users.value.filter((u) => u.id !== row.id);
      }
    },
  },
];

// ===================================
// Custom Styling
// ===================================

const customClasses: TableCustomClasses = {
  container: 'custom-table-container',
  headerCell: 'custom-header-cell',
  row: 'custom-row',
  cell: 'custom-cell',
};

const customStyles: TableCustomStyles = {
  container: {
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  headerCell: {
    backgroundColor: '#1c398e',
    color: '#ffffff',
  },
};

// ===================================
// Event Handlers
// ===================================

const lastAction = ref<ActionPayload<User> | null>(null);

function handleAction(payload: ActionPayload<User>): void {
  console.log('Action triggered:', payload);
  lastAction.value = payload;
}

function handleSort(payload: SortPayload<User>): void {
  console.log('Sort changed:', payload);
}

function loadUsers(): void {
  // In a real app, this would fetch from an API
  users.value = [
    {
      id: 1,
      name: 'New User',
      email: 'newuser@example.com',
      role: 'Viewer',
      status: 'active',
      createdAt: new Date(),
    },
  ];
}

// ===================================
// Utility Functions
// ===================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
</script>

<style scoped>
.table-example-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--ion-text-color-primary, #091667);
  margin-bottom: 32px;
}

.example-section {
  margin-bottom: 48px;
}

.example-section h2 {
  color: var(--ion-text-color, #1e1e1e);
  font-size: 1.25rem;
  margin-bottom: 8px;
}

.example-section p {
  color: var(--ion-text-color-secondary, #6c757d);
  margin-bottom: 16px;
}

/* Status Badge Styles */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.status-inactive {
  background-color: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.status-pending {
  background-color: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

/* User Cell with Avatar */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--ion-color-primary, #1c398e),
    var(--ion-color-secondary, #9c222b)
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
  color: var(--ion-text-color-secondary, #6c757d);
}

.empty-state button {
  margin-top: 8px;
  padding: 8px 16px;
  background: var(--ion-color-primary, #1c398e);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-state button:hover {
  background: var(--ion-color-primary-dark, #091667);
}

/* Action Result */
.action-result {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  background: var(--ion-card-background, #ffffff);
  border: 1px solid var(--ion-card-border-color, #e9ecef);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Custom Class Overrides (for example section) */
:deep(.custom-table-container) {
  border: 2px solid var(--ion-color-primary, #1c398e);
}

:deep(.custom-row:hover) {
  background: rgba(28, 57, 142, 0.05) !important;
}
</style>
