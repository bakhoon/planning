const COLORS = {
  '할 일': '#2457C5',
  회의: '#B8590E',
  마감: '#B42318',
  메모: '#5B636E',
};

export default function TypeTag({ type }) {
  const c = COLORS[type] || COLORS['메모'];
  return (
    <span className="tag" style={{ color: c, background: c + '14', borderColor: c + '40' }}>
      {type}
    </span>
  );
}
