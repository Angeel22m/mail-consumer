import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { Twilio } from 'twilio';

jest.mock('@sendgrid/mail'); // Mock de SendGrid
jest.mock('twilio'); // Mock de Twilio

describe('MaileService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'TWILIO_SID') return 'fake_sid';
      if (key === 'TWILIO_TOKEN') return 'fake_token';
      return null;
    }),
  } as unknown as ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generarMensajeHTML', () => {
    it('should generate HTML containing the patient name and date/time', () => {
      const data = {
        citaId: 1,
        destinatario: 'test@example.com',
        nombrePaciente: 'Juan Pérez',
        fecha: '2025-11-21',
        hora: '15:00',
      };
      // @ts-ignore private method access
      const html = service['generarMensajeHTML'](data);
      expect(html).toContain('Juan Pérez');
      expect(html).toContain('2025-11-21');
      expect(html).toContain('15:00');
    });
  });

  describe('sendMail', () => {
    it('should call sgMail.send with correct arguments', async () => {
      (sgMail.send as jest.Mock).mockResolvedValueOnce(true);

      await service.sendMail('test@example.com', 'Asunto de prueba', '<p>Hola</p>');

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Asunto de prueba',
          html: '<p>Hola</p>',
        }),
      );
    });

    it('should throw error if sgMail.send fails', async () => {
      (sgMail.send as jest.Mock).mockRejectedValueOnce(new Error('Send error'));

      await expect(
        service.sendMail('test@example.com', 'Asunto', '<p>Hola</p>'),
      ).rejects.toThrow('Send error');
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
      // @ts-ignore Mock sendMail
      service.sendMail = jest.fn().mockResolvedValue(true);

      await service.procesarTareaRecordatorio(data);

      expect(service.sendMail).toHaveBeenCalledTimes(1);
      const htmlArg = (service.sendMail as jest.Mock).mock.calls[0][2];
      expect(htmlArg).toContain('Juan Pérez');
      expect(htmlArg).toContain('2025-11-21');
    });
  });
});
