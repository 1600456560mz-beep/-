import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Mistake } from './db';

export async function generatePDF(mistakes: Mistake[]) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px'; // Approx A4 width in pixels
  container.style.background = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';

  container.innerHTML = `
    <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 40px; font-size: 24px;">AI 错题举一反三练习册</h1>
    <p style="text-align: right; font-size: 12px; color: #666;">生成日期：${new Date().toLocaleDateString()}</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0 40px 0;">
  `;

  mistakes.forEach((m, index) => {
    const section = document.createElement('div');
    section.style.marginBottom = '60px';
    section.style.pageBreakInside = 'avoid';
    
    section.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">记录 ${index + 1}</span>
        <span style="color: #666; font-size: 12px;">知识点: <b>${m.knowledgePoint}</b></span>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
        <h3 style="margin-top: 0; font-size: 14px; color: #475569;">【原错题内容】</h3>
        <p style="font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${m.originalText}</p>
      </div>

      <h3 style="font-size: 14px; color: #475569; margin-top: 30px;">【举一反三练习】</h3>
      ${m.variations.map((v, i) => `
        <div style="margin-bottom: 25px; border-bottom: 1px dashed #eee; padding-bottom: 15px;">
          <p style="font-size: 13px; color: #1e293b; line-height: 1.6;"><b>练习题 ${i + 1}:</b> ${v.question}</p>
          <div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 12px;">
            <p style="margin: 0; color: #92400e;"><b>参考答案:</b> ${v.answer}</p>
            <p style="margin: 5px 0 0 0; color: #b45309;"><b>易错解析:</b> ${v.explanation}</p>
          </div>
        </div>
      `).join('')}
    `;
    container.appendChild(section);
  });

  const footer = document.createElement('div');
  footer.style.textAlign = 'center';
  footer.style.fontSize = '10px';
  footer.style.color = '#999';
  footer.style.marginTop = '40px';
  footer.innerText = '由 AI 错题打印机生成 - 你的智能学习助手';
  container.appendChild(footer);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`ai-mistakes-${new Date().getTime()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
