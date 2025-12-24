using System.Net;
using System.Net.Mail;
using employee_management.Application.Common.Services;
using Microsoft.Extensions.Configuration;

namespace employee_management.Persistence.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var smtpSection = _configuration.GetSection("Smtp");

            // Ensure values are not null before parsing
            var host = smtpSection["Host"] ?? throw new InvalidOperationException("SMTP Host is not configured.");
            var port = smtpSection["Port"] ?? throw new InvalidOperationException("SMTP Port is not configured.");
            var username = smtpSection["Username"] ?? throw new InvalidOperationException("SMTP Username is not configured.");
            var password = smtpSection["Password"] ?? throw new InvalidOperationException("SMTP Password is not configured.");
            var enableSsl = smtpSection["EnableSsl"] ?? throw new InvalidOperationException("SMTP EnableSsl is not configured.");
            var from = smtpSection["From"] ?? throw new InvalidOperationException("SMTP From address is not configured.");

            var smtpClient = new SmtpClient(host)
            {
                Port = int.Parse(port),
                Credentials = new NetworkCredential(username, password),
                EnableSsl = bool.Parse(enableSsl)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(from),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}