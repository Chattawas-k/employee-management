namespace employee_management.Domain.Enums
{
    public enum AvailabilityStatus
    {
        Available = 1,
        Busy = 2,
        LunchBreak = 3, // พักเที่ยง (เดิมคือ Break/พัก)
        Unavailable = 4,
        Leave = 5,      // ลา (เดิมคือ NotWorking/ไม่ได้ทำงาน)
        OffsiteCustomer = 6 // พบลูกค้านอกสถานที่
    }
}

