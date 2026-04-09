
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Shipment } from '../types';

export const generateShipmentLabel = async (shipment: Shipment): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150] // Standard label size 4x6 inches approx
  });

  // Generate QR Code
  const qrDataUrl = await QRCode.toDataURL(shipment.referencia_externa, {
    margin: 1,
    width: 100
  });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TALKUAL', 50, 15, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(10, 20, 90, 20);

  // Reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Referencia:', 10, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(shipment.referencia_externa, 10, 37);

  // QR Code
  doc.addImage(qrDataUrl, 'PNG', 65, 25, 25, 25);

  doc.line(10, 45, 90, 45);

  // Destination
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DESTINATARIO:', 10, 55);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(shipment.cliente_nombre, 10, 62);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(shipment.destino_calle, 10, 70);
  doc.text(`${shipment.destino_codigo_postal} ${shipment.destino_poblacion}`, 10, 77);
  doc.text(`${shipment.destino_provincia}, ${shipment.destino_pais}`, 10, 84);

  if (shipment.cliente_telefono) {
    doc.text(`Telf: ${shipment.cliente_telefono}`, 10, 92);
  }

  doc.line(10, 100, 90, 100);

  // Shipment Info
  doc.setFontSize(10);
  doc.text('DETALLES DEL ENVÍO:', 10, 110);
  
  doc.setFontSize(9);
  doc.text(`Bultos: ${shipment.total_bultos}`, 10, 118);
  doc.text(`Peso: ${shipment.total_peso} kg`, 40, 118);
  doc.text(`Volumen: ${shipment.total_volumen} m³`, 70, 118);

  doc.text(`Fecha Entrega: ${new Date(shipment.fecha_entrega_estimada).toLocaleDateString()}`, 10, 126);
  doc.text(`Ruta: ${shipment.franja_horaria}`, 10, 132);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Hidalgo Transportes - Logística Talkual', 50, 145, { align: 'center' });

  // Return as data URL for preview/download
  return doc.output('datauristring');
};
