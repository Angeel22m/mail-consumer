import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail');

describe('MailService', () => {
  let service: MailService;

  // Guardamos los valores originales
  const OLD_ENV = process.env;

  beforeEach(async () => {
    // Configuramos variables de entorno temporales
    process.env = { ...OLD_ENV };
    process.env.SENDGRID_API_KEY = 'SG.fake_api_key';
    process.env.FROM_EMAIL = 'test@example.com';

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Restauramos el entorno original
    process.env = OLD_ENV;
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
      // @ts-ignore
      const html = service['generarMensajeHTML'](data);
      expect(html).toContain('Juan Pérez');
      expect(html).toContain('2025-11-21');
      expect(html).toContain('15:00');
    });
  });

  describe('sendMail', () => {
    it('should call sgMail.send with correct arguments', async () => {
      (sgMail.send as jest.Mock).mockResolvedValueOnce(true);

      await service.sendMail('test@example.com', 'Asunto', '<p>Hola</p>');

      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Asunto',
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
      // @ts-ignore
      service.sendMail = jest.fn().mockResolvedValue(true);

      await service.procesarTareaRecordatorio(data);

      expect(service.sendMail).toHaveBeenCalledTimes(1);
      const htmlArg = (service.sendMail as jest.Mock).mock.calls[0][2];
      expect(htmlArg).toContain('Juan Pérez');
      expect(htmlArg).toContain('2025-11-21');
      expect(htmlArg).toContain('15:00');
    });
  });
});
