import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentMenu } from '../content-menu/content-menu';

// amCharts imports
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentMenu],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.scss']
})
export class ReportesComponent implements OnInit, AfterViewInit, OnDestroy {
  private lineRoot: am5.Root | undefined;
  private pieRoot: am5.Root | undefined;

  private salesData = [
    { month: "Ene", ventas: 23000, gastos: 18000 },
    { month: "Feb", ventas: 31000, gastos: 22000 },
    { month: "Mar", ventas: 28000, gastos: 19000 },
    { month: "Abr", ventas: 35000, gastos: 24000 },
    { month: "May", ventas: 42000, gastos: 28000 },
    { month: "Jun", ventas: 38000, gastos: 26000 }
  ];

  private categoryData = [
    { category: "Productos", value: 45, color: "#406eba" },
    { category: "Servicios", value: 30, color: "#43B581" },
    { category: "Consultoria", value: 15, color: "#FAA61A" },
    { category: "Soporte", value: 10, color: "#DA3E3E" }
  ];

  ngOnInit(): void {
    console.log('🚀 Inicializando componente Reportes');
  }

  ngAfterViewInit(): void {
    // Esperar un poco para que el DOM esté listo
    setTimeout(() => {
      this.createCharts();
    }, 200);
  }

  ngOnDestroy(): void {
    console.log('🧹 Limpiando gráficos...');
    if (this.lineRoot) {
      this.lineRoot.dispose();
    }
    if (this.pieRoot) {
      this.pieRoot.dispose();
    }
  }

  private createCharts(): void {
    try {
      this.createLineChart();
      this.createPieChart();
      console.log('✅ Gráficos creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando gráficos:', error);
    }
  }

  private createLineChart(): void {
    console.log('📈 Creando gráfico de líneas...');
    
    // Verificar que el elemento existe
    const element = document.getElementById("lineChartDiv");
    if (!element) {
      console.error('❌ Elemento lineChartDiv no encontrado');
      return;
    }
    
    // Crear root
    this.lineRoot = am5.Root.new("lineChartDiv");
    
    // Configurar tema
    this.lineRoot.setThemes([am5themes_Animated.new(this.lineRoot)]);
    
    // Crear chart
    const chart = this.lineRoot.container.children.push(
      am5xy.XYChart.new(this.lineRoot, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
      })
    );

    // Crear ejes
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(this.lineRoot, {
        categoryField: "month",
        renderer: am5xy.AxisRendererX.new(this.lineRoot, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(this.lineRoot, {
        renderer: am5xy.AxisRendererY.new(this.lineRoot, {})
      })
    );

    // Crear series de ventas
    const ventasSeries = chart.series.push(
      am5xy.LineSeries.new(this.lineRoot, {
        name: "Ventas",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "ventas",
        categoryXField: "month",
        stroke: am5.color("#406eba"),
        tooltip: am5.Tooltip.new(this.lineRoot, {
          labelText: "Ventas: ${valueY}"
        })
      })
    );

    // Crear series de gastos
    const gastosSeries = chart.series.push(
      am5xy.LineSeries.new(this.lineRoot, {
        name: "Gastos",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "gastos",
        categoryXField: "month",
        stroke: am5.color("#DA3E3E"),
        tooltip: am5.Tooltip.new(this.lineRoot, {
          labelText: "Gastos: ${valueY}"
        })
      })
    );

    // Configurar los datos
    xAxis.data.setAll(this.salesData);
    ventasSeries.data.setAll(this.salesData);
    gastosSeries.data.setAll(this.salesData);

    // Agregar cursor
    chart.set("cursor", am5xy.XYCursor.new(this.lineRoot, {}));

    // Agregar leyenda
    const legend = chart.children.push(
      am5.Legend.new(this.lineRoot, {
        centerX: am5.p50,
        x: am5.p50
      })
    );
    legend.data.setAll(chart.series.values);
    
    console.log('✅ Gráfico de líneas creado');
  }

  private createPieChart(): void {
    console.log('🥧 Creando gráfico de pastel...');
    
    // Verificar que el elemento existe
    const element = document.getElementById("pieChartDiv");
    if (!element) {
      console.error('❌ Elemento pieChartDiv no encontrado');
      return;
    }
    
    // Crear root
    this.pieRoot = am5.Root.new("pieChartDiv");
    
    // Configurar tema
    this.pieRoot.setThemes([am5themes_Animated.new(this.pieRoot)]);
    
    // Crear chart
    const chart = this.pieRoot.container.children.push(
      am5percent.PieChart.new(this.pieRoot, {
        layout: this.pieRoot.verticalLayout,
        innerRadius: am5.percent(50)
      })
    );

    // Crear series
    const series = chart.series.push(
      am5percent.PieSeries.new(this.pieRoot, {
        valueField: "value",
        categoryField: "category",
        alignLabels: false
      })
    );

    // Configurar colores
    series.get("colors")?.set("colors", [
      am5.color("#406eba"),
      am5.color("#43B581"),
      am5.color("#FAA61A"),
      am5.color("#DA3E3E")
    ]);

    // Configurar los datos
    series.data.setAll(this.categoryData);

    // Configurar labels
    series.labels.template.setAll({
      fontSize: 12,
      text: "{category}: {valuePercentTotal.formatNumber('#.0')}%"
    });

    // Agregar leyenda
    const legend = chart.children.push(
      am5.Legend.new(this.pieRoot, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 15,
        marginBottom: 15
      })
    );
    legend.data.setAll(series.dataItems);
    
    console.log('✅ Gráfico de pastel creado');
  }
}