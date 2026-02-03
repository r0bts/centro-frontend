/**
 * Modelos de datos para el módulo de Surtido de Almacén (Warehouse Supply)
 * Basado en la respuesta del endpoint GET /api/requisitions/{id}/supply
 */

/**
 * Producto individual dentro de una requisición de almacén
 * Incluye información de inventario disponible desde NetSuite
 */
export interface WarehouseProduct {
  /** ID del item de la requisición */
  id: string;
  
  /** Nombre del producto */
  name: string;
  
  /** Código del producto (item_id en base de datos) */
  code: string;
  
  /** Categoría del producto (ej: "Limpieza", "Alimentos") */
  category: string;
  
  /** Cantidad solicitada */
  requestedQuantity: number;
  
  /** Cantidad surtida/entregada */
  suppliedQuantity: number;
  
  /** Cantidad devuelta (opcional) */
  returnQuantity: number;
  
  /** Stock disponible en NetSuite en tiempo real */
  availableStock: number;
  
  /** Unidad de medida (LITRO, KG, ROLLO, etc.) */
  unit: string;
  
  /** Nombre de la ubicación del inventario (HERMES, GLACIAR) */
  location: string;
  
  /** Nombre del área donde se usará el producto */
  area: string;
  
  /** Código de barras del producto (para escaneo) */
  barcode: string;
  
  /** true si suppliedQuantity >= requestedQuantity */
  isSupplied: boolean;
  
  /** Notas específicas del item (opcional) */
  notes?: string;
}

/**
 * Estructura de producto según la API
 * Mapea la respuesta del endpoint /api/requisitions/{id}/supply
 */
export interface APIWarehouseProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  requestedQuantity: number;
  suppliedQuantity: number;
  returnQuantity: number;
  availableStock: number;
  unit: string;
  location: string;
  area: string;
  isSupplied: boolean;
  notes: string | null;
}

/**
 * Requisición individual para proceso de surtido
 * Orientada al flujo de trabajo de almacén
 */
export interface RequisitionWarehouse {
  /** ID formateado (REQ-XXXX) */
  id: string;
  
  /** Nombre completo del usuario que creó la requisición */
  creator: string;
  
  /** Fecha y hora de entrega en formato ISO 8601 */
  deliveryDate: string;
  
  /** Estado de la requisición (traducido al español) */
  status: string;
  
  /** Estado raw de la requisición (en_proceso, listo_recoger, etc) */
  statusRaw: string;
  
  /** Nombre de la ubicación/almacén (HERMES o GLACIAR) */
  businessUnit?: string;
  
  /** Nombre completo del usuario que autorizó */
  authorizedBy?: string;
  
  /** Fecha de autorización en formato ISO 8601 */
  authorizationDate?: string;
  
  /** Nombre completo del usuario que recogerá la requisición */
  pickupPerson?: string;
  
  /** ID del usuario que recogerá */
  pickupPersonId?: number;
  
  /** Indica si tiene firma electrónica */
  electronicSignature?: boolean;
  
  /** Hash de firma digital (8 bloques: 5CCE-C1B3-6385-44FF-ABEA-29F3-0B3B-FA62) */
  signatureHash?: string;
  
  /** Fecha de la firma digital */
  signatureDate?: string;
  
  /** PIN de 4 dígitos para validar entrega */
  pin?: string;
  
  /** Total de productos en la requisición */
  totalProducts: number;
  
  /** Cantidad de productos completamente surtidos */
  suppliedProducts: number;
  
  /** Cantidad de productos pendientes de surtir */
  pendingProducts: number;
  
  /** Indica si está esperando devolución */
  awaiting_return: boolean;
  
  /** Lista de productos con inventario */
  products: WarehouseProduct[];
}

/**
 * Estructura de la API para una requisición de surtido
 */
export interface APIRequisitionWarehouse {
  id: string;
  creator: string;
  deliveryDate: string;
  status: string;
  businessUnit: string | null;
  authorizedBy: string | null;
  authorizationDate: string | null;
  pickupPerson: string | null;
  pickupPersonId: number | null;
  electronicSignature: boolean;
  signatureHash: string | null;
  signatureDate: string | null;
  pin: string | null;
  totalProducts: number;
  suppliedProducts: number;
  pendingProducts: number;
  awaiting_return: boolean;
  products: APIWarehouseProduct[];
}

/**
 * Respuesta del endpoint GET /api/requisitions/{id}/supply
 */
export interface WarehouseSupplyResponse {
  success: boolean;
  message: string;
  data: {
    requisition: APIRequisitionWarehouse;
  };
}

/**
 * Sesión de surtido activa
 * Rastrea el progreso y actividad del operador de almacén
 */
export interface SupplySession {
  /** Hora de inicio de la sesión de surtido */
  startTime: Date;
  
  /** Total de códigos escaneados */
  scannedItems: number;
  
  /** Productos surtidos completamente */
  suppliedItems: number;
  
  /** Nombre del empleado realizando el surtido */
  employee: string;
  
  /** Total de productos en la requisición */
  totalProducts: number;
  
  /** Productos completados hasta el momento */
  completedProducts: number;
  
  /** Porcentaje de progreso (0-100) */
  progress: number;
}

/**
 * Agrupación de productos por categoría
 * Usado para organizar la vista de surtido
 */
export interface ProductsByCategory {
  [categoryName: string]: WarehouseProduct[];
}

/**
 * Estadísticas de inventario para un producto
 */
export interface ProductStockStatus {
  /** Producto tiene stock suficiente */
  hasSufficientStock: boolean;
  
  /** Producto tiene stock parcial */
  hasPartialStock: boolean;
  
  /** Producto sin stock disponible */
  hasNoStock: boolean;
  
  /** Clase CSS para el badge de estado */
  statusClass: string;
  
  /** Texto descriptivo del estado */
  statusText: string;
}

/**
 * Estados posibles de una requisición
 */
export type RequisitionStatus = 
  | 'Solicitado'
  | 'Autorizada'
  | 'En Proceso'
  | 'Listo para Recoger'
  | 'Entregado'
  | 'Espera Devolución'
  | 'Cancelado';
