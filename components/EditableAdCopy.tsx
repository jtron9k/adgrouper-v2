'use client';

interface EditableAdCopyProps {
  headlines: string[];
  descriptions: string[];
  onHeadlineChange: (index: number, value: string) => void;
  onDescriptionChange: (index: number, value: string) => void;
}

export default function EditableAdCopy({
  headlines,
  descriptions,
  onHeadlineChange,
  onDescriptionChange,
}: EditableAdCopyProps) {
  const headlineMaxLength = 30;
  const descriptionMaxLength = 90;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Headlines</h4>
        <div className="space-y-2">
          {headlines.map((headline, index) => (
            <div key={index}>
              <input
                type="text"
                value={headline}
                onChange={(e) => {
                  const value = e.target.value.slice(0, headlineMaxLength);
                  onHeadlineChange(index, value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Headline ${index + 1} (max ${headlineMaxLength} chars)`}
              />
              <div className="text-xs text-gray-500 mt-1">
                {headline.length}/{headlineMaxLength} characters
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-2">Descriptions</h4>
        <div className="space-y-2">
          {descriptions.map((description, index) => (
            <div key={index}>
              <textarea
                value={description}
                onChange={(e) => {
                  const value = e.target.value.slice(0, descriptionMaxLength);
                  onDescriptionChange(index, value);
                }}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Description ${index + 1} (max ${descriptionMaxLength} chars)`}
              />
              <div className="text-xs text-gray-500 mt-1">
                {description.length}/{descriptionMaxLength} characters
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

