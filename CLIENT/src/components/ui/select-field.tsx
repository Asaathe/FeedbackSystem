
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: SelectFieldProps) {
  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`w-full p-3 sm:p-2 rounded-lg min-h-[44px] text-base ${
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-green-400"
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
