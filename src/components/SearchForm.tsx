/** 검색 입력. JS 없이도 /search/?q= 로 이동한다. */
export default function SearchForm({
  className = 'search',
  style,
  button = '찾기',
  primary = true,
  id,
  defaultValue,
}: {
  className?: string;
  style?: React.CSSProperties;
  button?: string;
  primary?: boolean;
  id?: string;
  defaultValue?: string;
}) {
  return (
    <form className={className} action="/search/" method="get" role="search" style={style}>
      <input id={id} name="q" type="search" placeholder="예: 2027 수능 22번" aria-label="문항 검색" defaultValue={defaultValue} />
      <button className={primary ? 'primary' : undefined} type="submit">
        {button}
      </button>
    </form>
  );
}
