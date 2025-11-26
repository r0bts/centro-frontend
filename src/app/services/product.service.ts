import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  lastSync?: Date;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los productos
   */
  getAllProducts(): Observable<Product[]> {
    // Datos mock para pruebas - reemplazar con llamada real a API
    return of([
      // Mantenimiento
      {
        id: '101',
        code: '101',
        name: 'Aceite Lubricante Multiusos',
        description: 'Para bisagras, maquinaria ligera y cerraduras.',
        category: 'Mantenimiento',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '102',
        code: '102',
        name: 'Foco LED E27 Luz Blanca',
        description: 'Iluminación general para pasillos y oficinas.',
        category: 'Mantenimiento',
        unit: 'Pieza',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '103',
        code: '103',
        name: 'Clavos de Acero 2"',
        description: 'Para reparaciones generales en madera.',
        category: 'Mantenimiento',
        unit: 'Caja',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '104',
        code: '104',
        name: 'Pintura Acrílica Blanca (Galón)',
        description: 'Retoque de paredes y techos.',
        category: 'Mantenimiento',
        unit: 'Galón',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '105',
        code: '105',
        name: 'Cinta Adhesiva Aislante Negra',
        description: 'Para reparaciones eléctricas menores.',
        category: 'Mantenimiento',
        unit: 'Rollo',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '106',
        code: '106',
        name: 'Silicona Selladora Transparente',
        description: 'Para sellado de juntas y ventanas.',
        category: 'Mantenimiento',
        unit: 'Tubo',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '107',
        code: '107',
        name: 'Guantes de Trabajo Reforzados',
        description: 'Protección para personal de mantenimiento.',
        category: 'Mantenimiento',
        unit: 'Par',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '108',
        code: '108',
        name: 'Brochas para Pintar (Set de 3)',
        description: 'Diferentes tamaños para trabajos de retoque.',
        category: 'Mantenimiento',
        unit: 'Set',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '109',
        code: '109',
        name: 'Candado de Seguridad 50mm',
        description: 'Para almacenes, lockers o bodegas.',
        category: 'Mantenimiento',
        unit: 'Pieza',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '110',
        code: '110',
        name: 'Desbloqueador de Tuberías Líquido',
        description: 'Para desatascar lavabos y drenajes.',
        category: 'Mantenimiento',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      // Cafetería
      {
        id: '201',
        code: '201',
        name: 'Galletas de Avena (Paquete)',
        description: 'Para venta o consumo del personal.',
        category: 'Cafetería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '202',
        code: '202',
        name: 'Café Soluble Clásico 200g',
        description: 'Bebida para personal y reuniones.',
        category: 'Cafetería',
        unit: 'Frasco',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '203',
        code: '203',
        name: 'Leche en Polvo Entera 1kg',
        description: 'Para preparación de bebidas.',
        category: 'Cafetería',
        unit: 'Bolsa',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '204',
        code: '204',
        name: 'Azúcar Estándar (Kilo)',
        description: 'Para endulzar bebidas.',
        category: 'Cafetería',
        unit: 'Kilo',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '205',
        code: '205',
        name: 'Tazas Desechables para Café 8oz',
        description: 'Para servicio de cafetería.',
        category: 'Cafetería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '206',
        code: '206',
        name: 'Té Negro en Bolsitas (Caja de 25)',
        description: 'Opción de bebida caliente.',
        category: 'Cafetería',
        unit: 'Caja',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '207',
        code: '207',
        name: 'Edulcorante Sin Calorías (Caja 100 sobres)',
        description: 'Sustituto de azúcar.',
        category: 'Cafetería',
        unit: 'Caja',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '208',
        code: '208',
        name: 'Crema para Café Líquida (Litro)',
        description: 'Para servicio de café.',
        category: 'Cafetería',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '209',
        code: '209',
        name: 'Agua Embotellada 600ml (Paquete de 12)',
        description: 'Para venta o consumo general.',
        category: 'Cafetería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '210',
        code: '210',
        name: 'Servilletas de Papel Blancas (Paquete)',
        description: 'Para uso en mesas y barra.',
        category: 'Cafetería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      // Limpieza
      {
        id: '301',
        code: '301',
        name: 'Cloro Desinfectante 4L',
        description: 'Desinfección de pisos y superficies.',
        category: 'Limpieza',
        unit: 'Galón',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '302',
        code: '302',
        name: 'Jabón Líquido para Manos 1L',
        description: 'Uso en baños y lavamanos.',
        category: 'Limpieza',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '303',
        code: '303',
        name: 'Toallas de Papel Desechables (Paquete)',
        description: 'Para secado de manos.',
        category: 'Limpieza',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '304',
        code: '304',
        name: 'Limpiador Multiusos con Aroma 1L',
        description: 'Limpieza de escritorios y áreas comunes.',
        category: 'Limpieza',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '305',
        code: '305',
        name: 'Bolsas para Basura Negras Extra Grandes',
        description: 'Para botes de basura principales.',
        category: 'Limpieza',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '306',
        code: '306',
        name: 'Desinfectante en Aerosol Ambiental',
        description: 'Para neutralizar olores y desinfectar aire.',
        category: 'Limpieza',
        unit: 'Lata',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '307',
        code: '307',
        name: 'Detergente para Ropa (5kg)',
        description: 'Para lavado de uniformes y toallas del club.',
        category: 'Limpieza',
        unit: 'Bolsa',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '308',
        code: '308',
        name: 'Trapeador de Microfibra de Repuesto',
        description: 'Para limpieza de pisos.',
        category: 'Limpieza',
        unit: 'Pieza',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '309',
        code: '309',
        name: 'Limpiador de Vidrios y Cristales 1L',
        description: 'Para espejos y ventanas.',
        category: 'Limpieza',
        unit: 'Litro',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '310',
        code: '310',
        name: 'Pastillas Desodorantes para Baño (Caja)',
        description: 'Mantenimiento de sanitarios.',
        category: 'Limpieza',
        unit: 'Caja',
        isActive: true,
        createdAt: new Date('2024-03-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      // Papelería
      {
        id: '401',
        code: '401',
        name: 'Carpetas de Anillos Tamaño Carta',
        description: 'Para archivo de documentos importantes.',
        category: 'Papelería',
        unit: 'Pieza',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '402',
        code: '402',
        name: 'Hojas Blancas Carta (Paquete 500)',
        description: 'Para impresión y copias.',
        category: 'Papelería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '403',
        code: '403',
        name: 'Tóner para Impresora (Modelo Genérico)',
        description: 'Recarga de tinta para impresoras de oficina.',
        category: 'Papelería',
        unit: 'Cartucho',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '404',
        code: '404',
        name: 'Folders Tamaño Carta Manila',
        description: 'Para organización de expedientes.',
        category: 'Papelería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '405',
        code: '405',
        name: 'Plumas de Gel Negras (Caja)',
        description: 'Uso general en oficinas y recepción.',
        category: 'Papelería',
        unit: 'Caja',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '406',
        code: '406',
        name: 'Resmas de Papel Bond Color (Amarillo)',
        description: 'Para notas y documentos diferenciados.',
        category: 'Papelería',
        unit: 'Resma',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '407',
        code: '407',
        name: 'Cinta Adhesiva Transparente (Grande)',
        description: 'Para empaque y reparaciones de papel.',
        category: 'Papelería',
        unit: 'Rollo',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '408',
        code: '408',
        name: 'Post-it Notas Adhesivas (Paquete)',
        description: 'Para recordatorios rápidos.',
        category: 'Papelería',
        unit: 'Paquete',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '409',
        code: '409',
        name: 'Grapadora de Escritorio Reforzada',
        description: 'Para engrapado de documentos voluminosos.',
        category: 'Papelería',
        unit: 'Pieza',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      },
      {
        id: '410',
        code: '410',
        name: 'Marcadores Permanentes Negros (Set de 4)',
        description: 'Para señalización y cajas.',
        category: 'Papelería',
        unit: 'Set',
        isActive: true,
        createdAt: new Date('2024-04-01'),
        lastSync: new Date('2025-11-18T09:00:00')
      }
    ]);

    // Implementación real con API:
    // return this.http.get<Product[]>(`${this.API_URL}/products`)
    //   .pipe(
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Obtener producto por ID
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar producto
   */
  updateProduct(id: string, product: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/products/${id}`, product)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar producto
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/products/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Cambiar estado de producto (activar/desactivar)
   */
  toggleProductStatus(id: string): Observable<Product> {
    return this.http.patch<Product>(`${this.API_URL}/products/${id}/toggle-status`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sincronizar productos desde NetSuite
   */
  syncProducts(): Observable<Product[]> {
    return this.http.post<Product[]>(`${this.API_URL}/products/sync`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtener categorías disponibles
   */
  getAvailableCategories(): Observable<string[]> {
    return of(['Mantenimiento', 'Cafetería', 'Limpieza', 'Papelería']);
    
    // Implementación real con API:
    // return this.http.get<string[]>(`${this.API_URL}/categories`)
    //   .pipe(
    //     catchError(this.handleError)
    //   );
  }

  /**
   * Manejar errores de HTTP
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos de entrada inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 409:
          errorMessage = 'El producto ya existe';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }

    console.error('Error en ProductService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
