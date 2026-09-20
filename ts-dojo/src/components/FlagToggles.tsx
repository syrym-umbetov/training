import { FLAG_DOCS, type FlagName, type Flags } from '../monaco/setup.ts';

const ORDER: FlagName[] = [
  'strict',
  'strictNullChecks',
  'strictFunctionTypes',
  'noImplicitAny',
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
];

type Props = {
  flags: Flags;
  onChange: (next: Flags) => void;
};

export function FlagToggles({ flags, onChange }: Props) {
  return (
    <div className="flags">
      <p className="flags__title">tsconfig — щёлкай и смотри, как меняются ошибки</p>
      <div className="flags__row">
        {ORDER.map((name) => (
          <label key={name} className="flag" title={FLAG_DOCS[name]}>
            <input
              type="checkbox"
              checked={flags[name]}
              onChange={(e) => onChange({ ...flags, [name]: e.target.checked })}
            />
            <span>{name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
