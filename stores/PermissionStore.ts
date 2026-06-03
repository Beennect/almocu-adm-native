import { makeAutoObservable } from 'mobx';
import { authStore, FrontRole } from './AuthStore';

/**
 * Ações/recurso disponíveis no sistema.
 * Cada role tem um conjunto de abilities que define o que pode fazer.
 */
export type Ability =
  | 'menu:view'
  | 'menu:create'
  | 'menu:edit'
  | 'menu:delete'
  | 'stock:view'
  | 'stock:create'
  | 'stock:edit'
  | 'stock:delete'
  | 'orders:view'
  | 'orders:create'
  | 'orders:update-status'
  | 'orders:delete'
  | 'staff:view'
  | 'staff:manage-role'
  | 'staff:remove'
  | 'staff:invite'
  | 'dashboard:view'
  | 'restaurant:manage'
  | 'restaurant:suspend'
  | 'restaurant:create-branch'
  | 'suppliers:view'
  | 'suppliers:manage'
  | 'config:view'
  | 'financeiro:view'
  | 'fidelidade:view'
  | 'mesas:view'
  | 'delivery-module:view'
  | 'modules-store:view';

/**
 * Mapa de abilities por role frontend.
 * A role 'GERENTE' cobre tanto OWNER quanto MANAGER.
 * Abilities exclusivas de OWNER são separadas em 'owner-only'.
 */
const ROLE_ABILITIES: Record<FrontRole, Ability[]> = {
  GERENTE: [
    'menu:view',
    'menu:create',
    'menu:edit',
    'menu:delete',
    'stock:view',
    'stock:create',
    'stock:edit',
    'stock:delete',
    'orders:view',
    'orders:create',
    'orders:update-status',
    'orders:delete',
    'staff:view',
    'staff:manage-role',
    'staff:remove',
    'staff:invite',
    'dashboard:view',
    'restaurant:manage',
    'restaurant:suspend',     // será filtrado por isOwner
    'restaurant:create-branch', // será filtrado por isOwner
    'suppliers:view',
    'suppliers:manage',
    'config:view',
    'financeiro:view',
    'fidelidade:view',
    'mesas:view',
    'delivery-module:view',
    'modules-store:view',
  ],
  GARCOM: [
    'menu:view',
    'orders:view',
    'orders:create',
    'dashboard:view',
    'config:view',
  ],
  COZINHA: [
    'menu:view',
    'orders:view',
    'orders:update-status',
    'dashboard:view',
    'config:view',
  ],
  CAIXA: [
    'menu:view',
    'orders:view',
    'dashboard:view',
    'config:view',
  ],
  ENTREGADOR: [
    'menu:view',
    'orders:view',
    'orders:update-status',
    'dashboard:view',
    'config:view',
  ],
  COMUM: [
    'menu:view',
    'config:view',
  ],
  INDEFINIDO: [
    'config:view',
  ],
};

/**
 * Abilities exclusivas de OWNER (backend role 'OWNER')
 * que não estão disponíveis para MANAGER.
 */
const OWNER_ONLY_ABILITIES: Ability[] = [
  'restaurant:suspend',
  'restaurant:create-branch',
];

class PermissionStore {
  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Retorna todas as abilities da role ativa do usuário,
   * considerando se é OWNER ou MANAGER.
   */
  get abilities(): Ability[] {
    const role = authStore.activeRole;
    const base = ROLE_ABILITIES[role] || [];

    // Se é GERENTE mas não é OWNER, remove abilities exclusivas de OWNER
    if (role === 'GERENTE' && !authStore.isOwner) {
      return base.filter((a) => !OWNER_ONLY_ABILITIES.includes(a));
    }

    return base;
  }

  /**
   * Verifica se o usuário ativo possui uma ability específica.
   */
  can(ability: Ability): boolean {
    return this.abilities.includes(ability);
  }

  /**
   * Verifica se o usuário possui todas as abilities listadas.
   */
  canAll(...abilities: Ability[]): boolean {
    return abilities.every((a) => this.can(a));
  }

  /**
   * Verifica se o usuário possui pelo menos uma das abilities listadas.
   */
  canAny(...abilities: Ability[]): boolean {
    return abilities.some((a) => this.can(a));
  }

  /**
   * Retorna os módulos/menus que o usuário pode acessar, baseado nas abilities.
   * Usado pelo Navbar para filtrar os itens de navegação.
   */
  getAllowedModuleIds(): Set<string> {
    const ab = this.abilities;
    const modules = new Set<string>();

    if (ab.includes('dashboard:view')) modules.add('dashboard');
    if (ab.includes('menu:view')) modules.add('cardapio');
    if (ab.includes('orders:view') || ab.includes('orders:create')) {
      modules.add('pedidos');
    }
    if (ab.includes('stock:view')) modules.add('estoque');
    if (ab.includes('staff:view') || ab.includes('staff:manage-role')) {
      modules.add('funcionarios');
    }
    if (ab.includes('suppliers:view')) modules.add('fornecedores');
    if (ab.includes('financeiro:view')) modules.add('financeiro');
    if (ab.includes('fidelidade:view')) modules.add('fidelidade');
    if (ab.includes('mesas:view')) modules.add('mesas');
    if (ab.includes('delivery-module:view')) modules.add('delivery');
    if (ab.includes('modules-store:view')) modules.add('modulos');

    return modules;
  }
}

export const permissionStore = new PermissionStore();
