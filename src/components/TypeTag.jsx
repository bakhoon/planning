const COLORS = {
  Task: '#2457C5',
  Meeting: '#B8590E',
  Deadline: '#B42318',
  Note: '#5B636E',
};

export default function TypeTag({ type }) {
  const c = COLORS[type] || COLORS.Note;
  return (
    <span className="tag" style={{ color: c, background: c + '14', borderColor: c + '40' }}>
      {type}
    </span>
  );
}
