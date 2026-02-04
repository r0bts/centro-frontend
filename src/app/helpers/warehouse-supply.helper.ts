/**
 * Helper para funciones de surtido de almacén
 * Lógica de negocio reutilizable separada del componente
 */

import {
  WarehouseProduct,
  APIWarehouseProduct,
  RequisitionWarehouse,
  APIRequisitionWarehouse,
  ProductsByCategory,
  ProductStockStatus,
  SupplySession
} from '../models/warehouse-supply.model';

export class WarehouseSupplyHelper {
  /**
   * Mapea un producto de la API al formato del frontend
   * Convierte camelCase de la API y agrega barcode generado
   */
  static mapProductFromAPI(apiProduct: APIWarehouseProduct): WarehouseProduct {
    return {
      id: apiProduct.id,
      name: apiProduct.name || '',
      code: apiProduct.code || '',
      category: apiProduct.category || 'Sin categoría',
      requestedQuantity: apiProduct.requestedQuantity || 0,
      suppliedQuantity: apiProduct.suppliedQuantity || 0,
      newDeliveryQuantity: 0, // Inicializar en 0 para nueva entrega
      returnQuantity: apiProduct.returnQuantity || 0,
      availableStock: apiProduct.availableStock || 0,
      unit: apiProduct.unit || '',
      location: apiProduct.location || '',
      area: apiProduct.area || '',
      barcode: apiProduct.code || '', // Usar el código como barcode por defecto
      isSupplied: apiProduct.isSupplied || false,
      notes: apiProduct.notes || undefined
    };
  }

  /**
   * Mapea una requisición de la API al formato del frontend
   */
  static mapRequisitionFromAPI(apiRequisition: APIRequisitionWarehouse): RequisitionWarehouse {
    return {
      id: apiRequisition.id,
      creator: apiRequisition.creator || '',
      deliveryDate: apiRequisition.deliveryDate,
      status: apiRequisition.status,
      statusRaw: this.getStatusRaw(apiRequisition.status),
      businessUnit: apiRequisition.businessUnit || undefined,
      authorizedBy: apiRequisition.authorizedBy || undefined,
      authorizationDate: apiRequisition.authorizationDate || undefined,
      pickupPerson: apiRequisition.pickupPerson || undefined,
      pickupPersonId: apiRequisition.pickupPersonId || undefined,
      electronicSignature: apiRequisition.electronicSignature || false,
      signatureHash: apiRequisition.signatureHash || undefined,
      signatureDate: apiRequisition.signatureDate || undefined,
      pin: apiRequisition.pin || undefined,
      totalProducts: apiRequisition.totalProducts,
      suppliedProducts: apiRequisition.suppliedProducts,
      pendingProducts: apiRequisition.pendingProducts,
      awaiting_return: apiRequisition.awaiting_return,
      products: apiRequisition.products.map(p => this.mapProductFromAPI(p))
    };
  }

  /**
   * Obtener estado raw desde el estado traducido
   */
  static getStatusRaw(status: string): string {
    const statusMap: {[key: string]: string} = {
      'Solicitado': 'solicitado',
      'Solicitada': 'solicitado',
      'Autorizado': 'autorizado',
      'Autorizada': 'autorizado',
      'Listo para Recoger': 'listo_recoger',
      'Entregado': 'entregado',
      'Entregada': 'entregado',
      'Espera Devolución': 'espera_devolucion',
      'Cancelado': 'cancelado',
      'Cancelada': 'cancelado'
    };
    return statusMap[status] || status.toLowerCase().replace(/ /g, '_');
  }

  /**
   * Agrupa productos por categoría
   * Retorna un objeto con categorías como claves y arrays de productos como valores
   */
  static groupProductsByCategory(products: WarehouseProduct[]): ProductsByCategory {
    const grouped: ProductsByCategory = {};
    
    products.forEach(product => {
      const category = product.category || 'Sin categoría';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }

  /**
   * Extrae lista única de categorías ordenadas alfabéticamente
   */
  static extractCategories(productsByCategory: ProductsByCategory): string[] {
    return Object.keys(productsByCategory).sort();
  }

  /**
   * Filtra productos por término de búsqueda
   * Busca en: nombre, código, barcode, ubicación, área
   */
  static filterProductsBySearch(products: WarehouseProduct[], searchTerm: string): WarehouseProduct[] {
    if (!searchTerm.trim()) {
      return products;
    }
    
    const term = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      product.barcode.toLowerCase().includes(term) ||
      product.location.toLowerCase().includes(term) ||
      product.area?.toLowerCase().includes(term)
    );
  }

  /**
   * Filtra productos por categoría
   */
  static filterProductsByCategory(
    products: WarehouseProduct[],
    category: string
  ): WarehouseProduct[] {
    if (category === 'all') {
      return products;
    }
    
    return products.filter(p => p.category === category);
  }

  /**
   * Filtra productos pendientes de surtir
   */
  static filterPendingProducts(products: WarehouseProduct[]): WarehouseProduct[] {
    return products.filter(p => !p.isSupplied);
  }

  /**
   * Obtiene el estado de stock de un producto
   */
  static getProductStockStatus(product: WarehouseProduct): ProductStockStatus {
    const hasSufficientStock = product.availableStock >= product.requestedQuantity;
    const hasPartialStock = product.availableStock > 0 && product.availableStock < product.requestedQuantity;
    const hasNoStock = product.availableStock === 0;
    
    let statusClass = '';
    let statusText = '';
    
    if (product.isSupplied) {
      statusClass = 'text-success';
      statusText = 'Completo';
    } else if (product.suppliedQuantity > 0) {
      statusClass = 'text-warning';
      statusText = 'Parcial';
    } else if (hasNoStock) {
      statusClass = 'text-danger';
      statusText = 'Sin Stock';
    } else {
      statusClass = 'text-secondary';
      statusText = 'Pendiente';
    }
    
    return {
      hasSufficientStock,
      hasPartialStock,
      hasNoStock,
      statusClass,
      statusText
    };
  }

  /**
   * Obtiene la clase CSS para el stock status
   */
  static getStockStatusClass(product: WarehouseProduct): string {
    if (product.availableStock >= product.requestedQuantity) {
      return 'text-success';
    } else if (product.availableStock > 0) {
      return 'text-warning';
    } else {
      return 'text-danger';
    }
  }

  /**
   * Obtiene la clase CSS para el badge de estado
   */
  static getStatusBadgeClass(product: WarehouseProduct): string {
    const status = this.getProductStockStatus(product);
    
    if (product.isSupplied) {
      return 'bg-success';
    } else if (product.suppliedQuantity > 0) {
      return 'bg-warning';
    } else if (status.hasNoStock) {
      return 'bg-danger';
    } else {
      return 'bg-secondary';
    }
  }

  /**
   * Calcula el porcentaje de progreso de surtido
   */
  static calculateSupplyProgress(requisition: RequisitionWarehouse): number {
    if (requisition.totalProducts === 0) {
      return 0;
    }
    
    return Math.round((requisition.suppliedProducts / requisition.totalProducts) * 100);
  }

  /**
   * Inicializa una sesión de surtido
   */
  static initializeSupplySession(requisition: RequisitionWarehouse, employeeName: string): SupplySession {
    const suppliedItems = requisition.products.filter(p => p.isSupplied).length;
    
    return {
      startTime: new Date(),
      totalProducts: requisition.products.length,
      completedProducts: suppliedItems,
      progress: this.calculateSupplyProgress(requisition),
      scannedItems: 0,
      suppliedItems: suppliedItems,
      employee: employeeName
    };
  }

  /**
   * Actualiza el progreso de la sesión de surtido
   */
  static updateSupplySessionProgress(
    session: SupplySession,
    products: WarehouseProduct[]
  ): SupplySession {
    const completedProducts = products.filter(p => p.isSupplied).length;
    const totalProducts = products.length;
    
    return {
      ...session,
      completedProducts,
      suppliedItems: completedProducts,
      progress: totalProducts > 0 
        ? Math.round((completedProducts / totalProducts) * 100)
        : 0
    };
  }

  /**
   * Verifica si se puede completar el surtido
   * Solo permitir cuando TODOS los productos con stock disponible estén surtidos
   */
  static canCompleteSupply(requisition: RequisitionWarehouse): boolean {
    const productsWithStock = requisition.products.filter(p => p.availableStock > 0);
    if (productsWithStock.length === 0) {
      return false;
    }
    return productsWithStock.every(p => p.isSupplied);
  }

  /**
   * Verifica si hay productos para devolver
   */
  static hasProductsToReturn(products: WarehouseProduct[]): boolean {
    return products.some(p => p.returnQuantity && p.returnQuantity > 0);
  }

  /**
   * Obtiene lista de productos para devolver
   */
  static getProductsToReturn(products: WarehouseProduct[]): WarehouseProduct[] {
    return products.filter(p => p.returnQuantity && p.returnQuantity > 0);
  }

  /**
   * Actualiza la cantidad surtida de un producto
   * Valida que no exceda el stock disponible ni sea negativo
   */
  static updateSuppliedQuantity(
    product: WarehouseProduct,
    newQuantity: number
  ): WarehouseProduct {
    // Validar que sea un número válido
    if (isNaN(newQuantity) || newQuantity < 0) {
      newQuantity = 0;
    }
    
    // No permitir surtir más del stock disponible
    if (newQuantity > product.availableStock) {
      newQuantity = product.availableStock;
    }
    
    // Actualizar cantidad surtida
    const updatedProduct = { ...product };
    updatedProduct.suppliedQuantity = newQuantity;
    
    // Actualizar estado de surtido
    updatedProduct.isSupplied = newQuantity >= product.requestedQuantity;
    
    return updatedProduct;
  }

  /**
   * Actualiza la cantidad de devolución de un producto
   * Valida que no exceda la cantidad surtida ni sea negativo
   */
  static updateReturnQuantity(
    product: WarehouseProduct,
    newQuantity: number
  ): WarehouseProduct {
    // Validar que sea un número válido
    if (isNaN(newQuantity) || newQuantity < 0) {
      newQuantity = 0;
    }
    
    // No permitir devolver más de lo surtido
    if (newQuantity > product.suppliedQuantity) {
      newQuantity = product.suppliedQuantity;
    }
    
    return {
      ...product,
      returnQuantity: newQuantity
    };
  }

  /**
   * Alterna el estado de surtido de un producto
   * Si está surtido lo marca como pendiente, si está pendiente lo marca como surtido
   */
  static toggleProductSupply(product: WarehouseProduct): WarehouseProduct {
    const updatedProduct = { ...product };
    
    if (updatedProduct.isSupplied) {
      // Si está surtido, marcar como pendiente
      updatedProduct.isSupplied = false;
      updatedProduct.suppliedQuantity = 0;
    } else {
      // Si está pendiente, marcar como surtido con la cantidad solicitada (o disponible si es menor)
      const quantityToSupply = Math.min(
        updatedProduct.requestedQuantity,
        updatedProduct.availableStock
      );
      updatedProduct.suppliedQuantity = quantityToSupply;
      updatedProduct.isSupplied = quantityToSupply >= updatedProduct.requestedQuantity;
    }
    
    return updatedProduct;
  }

  /**
   * Actualiza estadísticas de una requisición basado en productos
   */
  static updateRequisitionStats(requisition: RequisitionWarehouse): RequisitionWarehouse {
    const suppliedProducts = requisition.products.filter(p => p.isSupplied).length;
    const pendingProducts = requisition.products.length - suppliedProducts;
    
    return {
      ...requisition,
      suppliedProducts,
      pendingProducts
    };
  }

  /**
   * Busca un producto por código de barras
   */
  static findProductByBarcode(
    products: WarehouseProduct[],
    barcode: string
  ): WarehouseProduct | undefined {
    return products.find(p => p.barcode === barcode);
  }

  /**
   * Formatea una fecha ISO a formato legible en español
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea una fecha ISO a hora legible
   */
  static formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Genera un NIP aleatorio de 4 dígitos
   */
  static generateCollectionNip(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Limpia todas las cantidades de devolución de los productos
   */
  static clearReturnQuantities(products: WarehouseProduct[]): WarehouseProduct[] {
    return products.map(product => ({
      ...product,
      returnQuantity: 0
    }));
  }

  /**
   * Valida que una cantidad sea un número positivo válido
   */
  static validateQuantity(value: string): number {
    const num = parseInt(value, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }
}
