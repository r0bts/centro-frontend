import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import {
  DepartmentLimitsService,
  Department,
  ProductLimit,
  SaveLimitItem
} from '../../../services/department-limits.service';
import Swal from 'sweetalert2';

interface EditableProductLimit extends ProductLimit {
  editing_max: string;
  dirty: boolean;
}

@Component({
  selector: 'app-department-limits',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './department-limits.html',
  styleUrls: ['./department-limits.scss']
})
export class DepartmentLimitsComponent implements OnInit {

  // ── Permisos ──────────────────────────────────
  canView  = false;
  canUpdate = false;
  canDelete = false;

  // ── Tabs ──────────────────────────────────────
  activeTab = signal<'departments' | 'users'>('departments');

  // ── TAB DEPARTAMENTOS ─────────────────────────
  departments = signal<Department[]>([]);
  selectedDeptId = signal<number | null>(null);
  selectedDeptName = signal<string>('');
  deptProducts = signal<EditableProductLimit[]>([]);
  loadingDepts   = signal(false);
  loadingDeptProd = signal(false);
  savingDept     = signal(false);

  // Modal agregar productos (depto)
  showAddDeptModal = signal(false);
  productSearch  = '';
  searchResults  = signal<{ id: number; name: string; category_name: string; category_id: number | null }[]>([]);
  allProducts    = signal<{ id: number; name: string; category_name: string; category_id: number | null }[]>([]);
  selectedNewProducts: Set<number> = new Set();
  newProductMaxMap: { [product_id: number]: string } = {};

  // ── TAB USUARIOS ─────────────────────────────
  userSearchQuery = '';
  userSearchResults = signal<{ id: number; username: string; firstName: string; lastName: string; departmentName: string }[]>([]);
  selectedUserId   = signal<number | null>(null);
  selectedUserName = signal<string>('');
  userProducts     = signal<EditableProductLimit[]>([]);
  loadingUserProd  = signal(false);
  savingUser       = signal(false);

  // Modal agregar productos (usuario)
  showAddUserModal  = signal(false);
  userProdSearch    = '';
  userProdResults   = signal<{ id: number; name: string; category_name: string; category_id: number | null }[]>([]);
  selectedNewUserProducts: Set<number> = new Set();
  newUserProductMaxMap: { [product_id: number]: string } = {};

  // Categorías colapsadas en modales
  collapsedDeptCats: Set<string> = new Set();
  collapsedUserCats: Set<string> = new Set();

  constructor(
    private authService: AuthService,
    private limitsService: DepartmentLimitsService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.canView   = this.authService.hasPermission('department_limits', 'view');
    this.canUpdate = this.authService.hasPermission('department_limits', 'update');
    this.canDelete = this.authService.hasPermission('department_limits', 'delete');

    if (!this.canView) {
      Swal.fire({ icon: 'warning', title: 'Acceso denegado', text: 'No tienes permisos para ver esta sección.' });
      return;
    }

    this.loadDepartments();
    this.loadAllProducts();
  }

  // ─────────────────────────────────────────────
  // DEPARTAMENTOS
  // ─────────────────────────────────────────────

  loadDepartments(): void {
    this.loadingDepts.set(true);
    this.limitsService.getDepartments().subscribe({
      next: res => {
        this.departments.set(res?.data ?? []);
        this.loadingDepts.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDepts.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  selectDept(dept: Department): void {
    this.selectedDeptId.set(dept.department_id);
    this.selectedDeptName.set(dept.department_name);
    this.loadDeptProducts(dept.department_id);
  }

  loadDeptProducts(deptId: number): void {
    this.loadingDeptProd.set(true);
    this.limitsService.getDeptProducts(deptId).subscribe({
      next: res => {
        this.deptProducts.set((res?.data?.limits ?? []).map(p => this.toEditable(p)));
        this.loadingDeptProd.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDeptProd.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  saveDeptLimits(): void {
    if (!this.canUpdate) return;
    const deptId = this.selectedDeptId();
    if (!deptId) return;

    const limits: SaveLimitItem[] = this.deptProducts().map(p => ({
      product_id: p.product_id,
      max_quantity: p.editing_max === '' || p.editing_max === null ? null : Number(p.editing_max)
    }));

    this.savingDept.set(true);
    this.limitsService.saveDeptLimits({ department_id: deptId, limits }).subscribe({
      next: () => {
        this.savingDept.set(false);
        this.deptProducts.update(list => list.map(p => ({ ...p, dirty: false })));
        this.loadDepartments(); // refrescar contadores
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Límites actualizados correctamente.', timer: 1800, showConfirmButton: false });
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingDept.set(false);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los cambios.' });
        this.cdr.markForCheck();
      }
    });
  }

  removeDeptProduct(item: EditableProductLimit): void {
    if (!this.canDelete) return;
    Swal.fire({
      title: '¿Eliminar límite?',
      text: `Se eliminará el límite de "${item.product_name}" para este departamento.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed) {
        this.limitsService.removeDeptLimit(item.id).subscribe({
          next: () => {
            this.deptProducts.update(list => list.filter(p => p.id !== item.id));
            this.loadDepartments();
            this.cdr.markForCheck();
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el límite.' })
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // MODAL AGREGAR PRODUCTOS (DEPTO)
  // ─────────────────────────────────────────────

  openAddDeptModal(): void {
    this.productSearch = '';
    this.selectedNewProducts.clear();
    this.newProductMaxMap = {};
    this.filterProductsForDept();
    this.showAddDeptModal.set(true);
  }

  filterProductsForDept(): void {
    const assigned = new Set(this.deptProducts().map(p => p.product_id));
    const q = this.productSearch.toLowerCase();
    this.searchResults.set(
      this.allProducts()
        .filter(p => !assigned.has(p.id) && (!q || p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q)))
    );
  }

  /** Agrupa searchResults por category_name para el modal de depto */
  get deptResultsByCategory(): { cat: string; products: { id: number; name: string; category_name: string; category_id: number | null }[] }[] {
    const map = new Map<string, { id: number; name: string; category_name: string; category_id: number | null }[]>();
    for (const p of this.searchResults()) {
      const cat = p.category_name || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, products]) => ({ cat, products }));
  }

  selectAllFromDeptCategory(cat: string): void {
    const group = this.deptResultsByCategory.find(g => g.cat === cat);
    if (!group) return;
    group.products.forEach(p => this.selectedNewProducts.add(p.id));
    this.cdr.markForCheck();
  }

  toggleDeptCat(cat: string): void {
    if (this.collapsedDeptCats.has(cat)) this.collapsedDeptCats.delete(cat);
    else this.collapsedDeptCats.add(cat);
    this.cdr.markForCheck();
  }

  toggleNewProduct(productId: number): void {
    if (this.selectedNewProducts.has(productId)) {
      this.selectedNewProducts.delete(productId);
    } else {
      this.selectedNewProducts.add(productId);
    }
  }

  confirmAddDeptProducts(): void {
    if (this.selectedNewProducts.size === 0) {
      this.showAddDeptModal.set(false);
      return;
    }
    const newItems: EditableProductLimit[] = [];
    this.selectedNewProducts.forEach(pid => {
      const prod = this.allProducts().find(p => p.id === pid);
      if (!prod) return;
      newItems.push({
        id: 0,
        product_id: pid,
        product_name: prod.name,
        product_code: null,
        unit: null,
        category_id: null,
        category: prod.category_name,
        max_quantity: null,
        editing_max: this.newProductMaxMap[pid] ?? '',
        dirty: true
      });
    });
    this.deptProducts.update(list => [...list, ...newItems]);
    this.showAddDeptModal.set(false);
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────
  // USUARIOS
  // ─────────────────────────────────────────────

  searchUsers(): void {
    const q = this.userSearchQuery.trim();
    if (!q) { this.userSearchResults.set([]); return; }
    this.userService.getAllUsers(200).subscribe({
      next: users => {
        const lower = q.toLowerCase();
        const filtered = users.filter(u =>
          u.username.toLowerCase().includes(lower) ||
          (u.firstName + ' ' + u.lastName).toLowerCase().includes(lower)
        ).slice(0, 20);
        this.userSearchResults.set(filtered.map(u => ({
          id: Number(u.id),
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          departmentName: (u as any).departmentName || ''
        })));
        this.cdr.markForCheck();
      }
    });
  }

  selectUser(user: { id: number; username: string; firstName: string; lastName: string; departmentName: string }): void {
    this.selectedUserId.set(user.id);
    this.selectedUserName.set(`${user.firstName} ${user.lastName} (${user.username})`);
    this.userSearchResults.set([]);
    this.userSearchQuery = '';
    this.loadUserProducts(user.id);
  }

  loadUserProducts(userId: number): void {
    this.loadingUserProd.set(true);
    this.limitsService.getUserProducts(userId).subscribe({
      next: res => {
        this.userProducts.set((res?.data?.limits ?? []).map(p => this.toEditable(p)));
        this.loadingUserProd.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingUserProd.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  saveUserLimits(): void {
    if (!this.canUpdate) return;
    const userId = this.selectedUserId();
    if (!userId) return;

    const limits: SaveLimitItem[] = this.userProducts().map(p => ({
      product_id: p.product_id,
      max_quantity: p.editing_max === '' ? null : Number(p.editing_max)
    }));

    this.savingUser.set(true);
    this.limitsService.saveUserLimits({ user_id: userId, limits }).subscribe({
      next: () => {
        this.savingUser.set(false);
        this.userProducts.update(list => list.map(p => ({ ...p, dirty: false })));
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Límites actualizados correctamente.', timer: 1800, showConfirmButton: false });
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingUser.set(false);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los cambios.' });
        this.cdr.markForCheck();
      }
    });
  }

  removeUserProduct(item: EditableProductLimit): void {
    if (!this.canDelete) return;
    Swal.fire({
      title: '¿Eliminar límite?',
      text: `Se eliminará el límite de "${item.product_name}" para este usuario.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed) {
        this.limitsService.removeUserLimit(item.id).subscribe({
          next: () => {
            this.userProducts.update(list => list.filter(p => p.id !== item.id));
            this.cdr.markForCheck();
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el límite.' })
        });
      }
    });
  }

  // ─────────────────────────────────────────────
  // MODAL AGREGAR PRODUCTOS (USUARIO)
  // ─────────────────────────────────────────────

  openAddUserModal(): void {
    this.userProdSearch = '';
    this.selectedNewUserProducts.clear();
    this.newUserProductMaxMap = {};
    this.filterProductsForUser();
    this.showAddUserModal.set(true);
  }

  filterProductsForUser(): void {
    const assigned = new Set(this.userProducts().map(p => p.product_id));
    const q = this.userProdSearch.toLowerCase();
    this.userProdResults.set(
      this.allProducts()
        .filter(p => !assigned.has(p.id) && (!q || p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q)))
    );
  }

  /** Agrupa userProdResults por category_name para el modal de usuario */
  get userResultsByCategory(): { cat: string; products: { id: number; name: string; category_name: string; category_id: number | null }[] }[] {
    const map = new Map<string, { id: number; name: string; category_name: string; category_id: number | null }[]>();
    for (const p of this.userProdResults()) {
      const cat = p.category_name || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, products]) => ({ cat, products }));
  }

  selectAllFromUserCategory(cat: string): void {
    const group = this.userResultsByCategory.find(g => g.cat === cat);
    if (!group) return;
    group.products.forEach(p => this.selectedNewUserProducts.add(p.id));
    this.cdr.markForCheck();
  }

  toggleUserCat(cat: string): void {
    if (this.collapsedUserCats.has(cat)) this.collapsedUserCats.delete(cat);
    else this.collapsedUserCats.add(cat);
    this.cdr.markForCheck();
  }

  toggleNewUserProduct(productId: number): void {
    if (this.selectedNewUserProducts.has(productId)) {
      this.selectedNewUserProducts.delete(productId);
    } else {
      this.selectedNewUserProducts.add(productId);
    }
  }

  confirmAddUserProducts(): void {
    if (this.selectedNewUserProducts.size === 0) {
      this.showAddUserModal.set(false);
      return;
    }
    const newItems: EditableProductLimit[] = [];
    this.selectedNewUserProducts.forEach(pid => {
      const prod = this.allProducts().find(p => p.id === pid);
      if (!prod) return;
      newItems.push({
        id: 0,
        product_id: pid,
        product_name: prod.name,
        product_code: null,
        unit: null,
        category_id: null,
        category: prod.category_name,
        max_quantity: null,
        editing_max: this.newUserProductMaxMap[pid] ?? '',
        dirty: true
      });
    });
    this.userProducts.update(list => [...list, ...newItems]);
    this.showAddUserModal.set(false);
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private toEditable(p: ProductLimit): EditableProductLimit {
    return {
      ...p,
      editing_max: p.max_quantity !== null ? String(p.max_quantity) : '',
      dirty: false
    };
  }

  markDirty(item: EditableProductLimit): void {
    item.dirty = true;
  }

  private loadAllProducts(): void {
    // Carga todos los productos activos para el modal de agregar
    this.limitsService.searchProducts('').subscribe({
      next: res => {
        this.allProducts.set(
          (res?.data?.products ?? [])
            .filter((p: any) => !p.isInactive)
            .map((p: any) => ({ id: Number(p.id), name: p.name, category_name: p.category_name ?? 'Sin categoría', category_id: p.category_id ?? null }))
        );
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  setTab(tab: 'departments' | 'users'): void {
    this.activeTab.set(tab);
  }

  trackById(_: number, item: any): number { return item.id; }
}
