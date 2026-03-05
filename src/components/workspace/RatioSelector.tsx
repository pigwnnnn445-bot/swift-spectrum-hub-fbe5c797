import OptionChipGroup from "./OptionChipGroup";

interface RatioSelectorProps {
  options: string[];
  selected: string;
  onSelect: (ratio: string) => void;
}

const RatioSelector = ({ options, selected, onSelect }: RatioSelectorProps) => {
  if (options.length === 0) return null;
  return <OptionChipGroup options={options} selected={selected} onSelect={onSelect} maxVisible={4} />;
};

export default RatioSelector;
