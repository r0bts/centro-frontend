const minH = 10;
const parseTime = (time) => {
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 2 + (parseInt(parts[1], 10) >= 30 ? 1 : 0);
};

const getGridColumn = (start, end) => {
  let startIdx = parseTime(start) - (minH * 2);
  let endIdx = parseTime(end) - (minH * 2);
  
  if (startIdx < 0) startIdx = 0;
  if (endIdx <= startIdx) endIdx = startIdx + 1;
  
  return `${startIdx + 1} / ${endIdx + 1}`;
};

console.log("15:00 to 16:00:", getGridColumn("15:00", "16:00"));
