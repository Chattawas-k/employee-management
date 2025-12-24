export const formatDateThai = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  if (hours === '00' && minutes === '00') { 
    return `${day} ${month} ${year}`; 
  }
  return `${day} ${month} ${year} ( ${hours}.${minutes} น. )`;
};

export const formatDateThaiFull = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

export const getDurationText = (startDate: string | null | undefined, endDate: Date = new Date()): string => {
  if (!startDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return "0 นาที";
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) {
    return `${hours} ชั่วโมง ${mins} นาที`;
  }
  return `${mins} นาที`;
};

