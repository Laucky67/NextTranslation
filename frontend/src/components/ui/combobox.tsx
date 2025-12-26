import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "选择...",
  emptyText = "无可用选项",
  allowCustom = false,
  customPlaceholder = "自定义输入...",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);
  const isCustomValue = value && !selectedOption;

  const filteredOptions = inputValue
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        opt.value.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleCustomSubmit = () => {
    if (inputValue.trim()) {
      onChange(inputValue.trim());
      setOpen(false);
      setInputValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selectedOption?.label || (isCustomValue ? value : placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex flex-col">
          {/* 搜索/自定义输入框 */}
          <div className="flex items-center border-b px-3 py-2">
            <Input
              placeholder={allowCustom ? customPlaceholder : "搜索..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && allowCustom && inputValue.trim()) {
                  e.preventDefault();
                  handleCustomSubmit();
                }
              }}
              className="h-8 border-0 p-0 focus-visible:ring-0"
            />
          </div>

          {/* 选项列表 */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {allowCustom && inputValue ? (
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-accent"
                    onClick={handleCustomSubmit}
                  >
                    使用 "{inputValue}"
                  </button>
                ) : (
                  emptyText
                )}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {value === option.value && <Check className="h-4 w-4" />}
                    </span>
                    {option.label}
                  </button>
                ))}
                {/* 自定义选项 */}
                {allowCustom && inputValue && !filteredOptions.some(o => o.value === inputValue) && (
                  <button
                    type="button"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={handleCustomSubmit}
                  >
                    <span className="text-muted-foreground">使用自定义: </span>
                    <span className="ml-1 font-medium">{inputValue}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
