/**
 * Helper para agrupación y transformación de requisiciones
 * Lógica pura sin dependencias de Angular - fácil de testear
 */

export interface RequisitionItem {
  id: string;
  creator: string;
  authorizer: string | null;
  pickupPerson?: string | null;
  status: 'Solicitado' | 'Autorizada' | 'En Proceso' | 'Listo para Recoger' | 'Entregado' | 'Espera Devolución' | 'Cancelado';
  creationDate: Date;
  deliveryDate: Date;
  businessUnit?: string;
}

export interface GroupedRequisitions {
  grouped: { [key: string]: RequisitionItem[] };
  dateKeys: string[];
}

export interface APIRequisitionItem {
  id: string | number;
  creator: string;
  authorizer?: string;
  pickupPerson?: string;
  status: string;
  creationDate: string;
  deliveryDateTime?: string;  // v1.1.0 - Nuevo campo combinado
  deliveryDate?: string;      // v1.0.0 - Campo legacy
  businessUnit?: string;
}

/**
 * Helper estático para operaciones de agrupación de requisiciones
 */
export class RequisitionGroupingHelper {
  
  /**
   * Mapea el status de la API al formato del componente
   */
  static mapStatusFromAPI(apiStatus: string): RequisitionItem['status'] {
    // El API ya retorna el status en español, validar que sea uno de los valores permitidos
    const validStatuses: RequisitionItem['status'][] = [
      'Solicitado',
      'Autorizada',
      'En Proceso',
      'Listo para Recoger',
      'Entregado',
      'Espera Devolución',
      'Cancelado'
    ];
    
    // Si ya viene en español y es válido, retornarlo
    if (validStatuses.includes(apiStatus as any)) {
      return apiStatus as RequisitionItem['status'];
    }
    
    // Fallback: mapeo desde inglés (por si acaso)
    const statusMap: { [key: string]: RequisitionItem['status'] } = {
      'requested': 'Solicitado',
      'authorized': 'Autorizada',
      'in_progress': 'En Proceso',
      'ready_for_pickup': 'Listo para Recoger',
      'delivered': 'Entregado',
      'waiting_return': 'Espera Devolución',
      'cancelled': 'Cancelado'
    };
    
    return statusMap[apiStatus] || 'Solicitado';
  }

  /**
   * Transforma los datos del API al formato RequisitionItem
   */
  static mapFromAPI(apiItems: APIRequisitionItem[]): RequisitionItem[] {
    if (!Array.isArray(apiItems)) {
      console.error('❌ mapFromAPI: apiItems no es un array', apiItems);
      return [];
    }

    return apiItems.map(item => ({
      id: item.id.toString(),
      creator: item.creator,
      authorizer: item.authorizer || null,
      pickupPerson: item.pickupPerson || null,
      status: this.mapStatusFromAPI(item.status),
      creationDate: new Date(item.creationDate),
      // Soportar tanto deliveryDateTime (v1.1.0) como deliveryDate (v1.0.0)
      deliveryDate: new Date(item.deliveryDateTime || item.deliveryDate || item.creationDate),
      businessUnit: item.businessUnit || ''
    }));
  }

  /**
   * Genera la clave del grupo según la fecha de entrega
   * Requisiciones pasadas/hoy se agrupan como "Hoy - Lunes y anteriores"
   * Requisiciones futuras se agrupan por fecha específica
   */
  static getGroupKey(deliveryDate: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(deliveryDate);
    date.setHours(0, 0, 0, 0);
    
    if (date <= today) {
      return 'Hoy - Lunes y anteriores';
    }
    
    // Formato: "30-Dic-2025"
    const day = date.getDate();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Agrupa requisiciones por fecha de entrega
   */
  static groupByDeliveryDate(requisitions: RequisitionItem[]): GroupedRequisitions {
    const grouped: { [key: string]: RequisitionItem[] } = {};

    // Agrupar
    requisitions.forEach(req => {
      const groupKey = this.getGroupKey(req.deliveryDate);
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(req);
    });

    // Ordenar las claves de fecha
    const dateKeys = this.sortDateKeys(Object.keys(grouped));

    return { grouped, dateKeys };
  }

  /**
   * Ordena las claves de fecha
   * "Hoy - Lunes y anteriores" siempre va primero
   * El resto se ordena cronológicamente
   */
  static sortDateKeys(keys: string[]): string[] {
    return keys.sort((a, b) => {
      if (a.startsWith('Hoy -')) return -1;
      if (b.startsWith('Hoy -')) return 1;
      
      const dateA = this.parseGroupKeyToDate(a);
      const dateB = this.parseGroupKeyToDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Convierte string de grupo de fecha a objeto Date
   * Para poder ordenar correctamente
   */
  static parseGroupKeyToDate(groupKey: string): Date {
    if (groupKey.startsWith('Hoy -')) {
      return new Date(); // Fechas pasadas van primero
    }
    
    // Formato: "30-Dic-2025"
    const parts = groupKey.split('-');
    const day = parseInt(parts[0]);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = monthNames.indexOf(parts[1]);
    const year = parseInt(parts[2]);
    
    return new Date(year, month, day);
  }

  /**
   * Filtra requisiciones por rango de fechas
   */
  static filterByDateRange(
    grouped: { [key: string]: RequisitionItem[] },
    dateKeys: string[],
    startDate?: Date,
    endDate?: Date
  ): GroupedRequisitions {
    if (!startDate && !endDate) {
      return { grouped, dateKeys };
    }

    // Normalizar fechas
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const filteredGrouped: { [key: string]: RequisitionItem[] } = {};
    const filteredKeys: string[] = [];

    dateKeys.forEach(dateGroup => {
      const filteredRequisitions = grouped[dateGroup].filter(requisition => {
        const deliveryDate = new Date(requisition.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);
        
        if (start && deliveryDate < start) return false;
        if (end && deliveryDate > end) return false;
        
        return true;
      });
      
      if (filteredRequisitions.length > 0) {
        filteredGrouped[dateGroup] = filteredRequisitions;
        filteredKeys.push(dateGroup);
      }
    });

    return { grouped: filteredGrouped, dateKeys: filteredKeys };
  }

  /**
   * Formatea una fecha al formato "30-Dic-2025"
   */
  static formatDate(date: Date): string {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Formatea la hora al formato "14:30"
   */
  static formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea fecha y hora juntos
   */
  static formatDateWithTime(date: Date): string {
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
  }
}
