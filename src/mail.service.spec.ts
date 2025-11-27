import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import nodemailer from 'nodemailer';

// --- 1. MOCKEAR NODEMAILER y VARIABLES DE ENTORNO ---

const mockSendMail = jest.fn().mockResolvedValue({ messageId: '123' });
// Aseguramos que la verificación siempre pasa para no interrumpir la inicialización
const mockVerify = jest.fn().mockResolvedValue(true); 

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  })),
}));

// Establecer variables de entorno mockeadas
process.env.SMTP_HOST = 'test-host';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'testpass';

// --- 2. DATOS DE PRUEBA ---

const mockJobData = {
  citaId: 42,
  destinatario: 'paciente@test.com',
  nombrePaciente: 'Juan Pérez',
  fecha: '2025-12-31',
  hora: '10:00 AM',
};

const mockVerificationPayload = {
  correo: 'user@test.com',
  codigo: '123456',
  asunto: 'Código de Verificación de Cuenta',
};

const mockRestablecimientoPayload = {
  correo: 'user@test.com',
  codigo: '987654',
  asunto: 'Restablecimiento de Contraseña Temporal',
};

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    // Restauramos los mocks antes de cada prueba
    mockSendMail.mockClear();
    mockVerify.mockClear();
    
    // Configuración del módulo de pruebas de NestJS
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        // Mockeamos el Logger de NestJS para no ensuciar la consola de prueba
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  // --- 3. PRUEBAS DE CONSTRUCTOR Y CONEXIÓN SMTP ---

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe configurar nodemailer y verificar la conexión SMTP en el constructor', () => {
    // 1. Verifica que nodemailer.createTransport fue llamado con las variables de entorno
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'test-host',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'testpass',
      },
    });
    
    // 2. Verifica que el método verify() del transporter fue llamado
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  // *******************************************************************
  // PRUEBA ELIMINADA/COMENTADA: 
  // Se ha quitado el test que simulaba el fallo de conexión SMTP 
  // para evitar que Jest interrumpa la ejecución (es lo que pediste).
  // *******************************************************************
  
  // --- 4. PRUEBAS DE MÉTODOS DE ENVÍO Y GENERACIÓN DE HTML ---

  describe('procesarTareaRecordatorio', () => {
    it('debe generar la plantilla de recordatorio y llamar a sendMail correctamente', async () => {
      await service.procesarTareaRecordatorio(mockJobData);

      // 1. Verifica que sendMail fue llamado
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      
      const sendMailArgs = mockSendMail.mock.calls[0][0];

      // 2. Verifica los argumentos de sendMail
      expect(sendMailArgs.to).toBe(mockJobData.destinatario);
      expect(sendMailArgs.subject).toBe('Recordatorio de cita');
      
      // 3. Verifica el contenido del HTML (busca elementos clave)
      const htmlContent = sendMailArgs.html;
      expect(htmlContent).toContain('Recordatorio de Cita');
      expect(htmlContent).toContain('Hola <strong>Juan Pérez</strong>,');
      expect(htmlContent).toContain(`<strong>📅 Fecha:</strong> ${mockJobData.fecha}`);
      expect(htmlContent).toContain('#4CAF50'); // Color de acento de Recordatorio
    });
  });

  describe('sendMail', () => {
    it('debe lanzar un error si nodemailer falla', async () => {
        // Mockeamos el sendMail para que falle en esta prueba
        mockSendMail.mockRejectedValueOnce(new Error('Fallo de envío forzado'));

        await expect(service.sendMail('fail@test.com', 'Subject', 'HTML'))
            .rejects.toThrow('Fallo de envío forzado');
    });
  });
});