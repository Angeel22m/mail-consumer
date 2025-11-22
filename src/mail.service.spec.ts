import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue(true);

    // Mock transporter
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generarMensajeHTML', () => {
    it('should generate HTML containing patient name and date/time', () => {
      const data = {
        citaId: 1,
        destinatario: 'test@example.com',
        nombrePaciente: 'Juan Pérez',
        fecha: '2025-11-21',
        hora: '15:00',
      };
      // @ts-ignore private access
      const html = service['generarMensajeHTML'](data);
      expect(html).toContain('Juan Pérez');
      expect(html).toContain('2025-11-21');
      expect(html).toContain('15:00');
    });
  });

  describe('sendMail', () => {
    it('should call transporter.sendMail with correct arguments', async () => {
      await service.sendMail('test@example.com', 'Asunto de prueba', '<p>Hola</p>');

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.SMTP_USER,
          to: 'test@example.com',
          subject: 'Asunto de prueba',
          html: '<p>Hola</p>',
        }),
      );
    });

    it('should throw error if sendMail fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('SMTP error'));
      await expect(
        service.sendMail('test@example.com', 'Asunto', '<p>Hola</p>'),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('procesarTareaRecordatorio', () => {
    it('should call sendMail with generated HTML', async () => {
      const data = {
        citaId: 1,
        destinatario: 'test@example.com',
        nombrePaciente: 'Juan Pérez',
        fecha: '2025-11-21',
        hora: '15:00',
      };
      // @ts-ignore mock sendMail
      service.sendMail = jest.fn().mockResolvedValue(true);

      await service.procesarTareaRecordatorio(data);

      expect(service.sendMail).toHaveBeenCalledTimes(1);
      const htmlArg = (service.sendMail as jest.Mock).mock.calls[0][2];
      expect(htmlArg).toContain('Juan Pérez');
      expect(htmlArg).toContain('2025-11-21');
    });
  });
});
