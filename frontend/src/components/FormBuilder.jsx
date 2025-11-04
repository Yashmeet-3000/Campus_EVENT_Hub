import { useState } from 'react';

/**
 * FormBuilder Component
 * Allows society heads to build custom event registration forms
 * with dynamic field management
 * 
 * @param {Array} formFields - Array of form field objects
 * @param {Function} setFormFields - Function to update parent state
 */
const FormBuilder = ({ formFields, setFormFields }) => {
  const [currentField, setCurrentField] = useState(null);

  // Supported field types
  const fieldTypes = [
    { value: 'short_text', label: 'Short Text' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'select', label: 'Dropdown (Select)' },
    { value: 'multi_select', label: 'Multiple Select' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' }
  ];

  /**
   * Add a new blank field to the form
   */
  const addField = () => {
    const newField = {
      id: Date.now(),
      label: '',
      type: 'short_text',
      required: false,
      options: [],
      error: ''
    };
    setFormFields([...formFields, newField]);
    setCurrentField(newField.id);
  };

  /**
   * Remove field by index
   * @param {number} index - Index of field to remove
   */
  const removeField = (index) => {
    const updatedFields = formFields.filter((_, i) => i !== index);
    setFormFields(updatedFields);
  };

  /**
   * Update specific field property
   * @param {number} index - Field index
   * @param {string} property - Property to update
   * @param {*} value - New value
   */
  const updateField = (index, property, value) => {
    const updatedFields = [...formFields];
    updatedFields[index][property] = value;
    
    // Clear error when user updates field
    updatedFields[index].error = '';
    
    // Validate field
    if (property === 'label' && !value.trim()) {
      updatedFields[index].error = 'Label is required';
    }
    
    if (property === 'options' && (updatedFields[index].type === 'select' || updatedFields[index].type === 'multi_select')) {
      const optionsArray = value.split(',').map(opt => opt.trim()).filter(opt => opt);
      if (optionsArray.length === 0) {
        updatedFields[index].error = 'Options are required for select fields';
      }
      updatedFields[index].options = optionsArray;
    }
    
    setFormFields(updatedFields);
  };

  /**
   * Move field up in order
   * @param {number} index - Field index
   */
  const moveFieldUp = (index) => {
    if (index === 0) return;
    const updatedFields = [...formFields];
    [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
    setFormFields(updatedFields);
  };

  /**
   * Move field down in order
   * @param {number} index - Field index
   */
  const moveFieldDown = (index) => {
    if (index === formFields.length - 1) return;
    const updatedFields = [...formFields];
    [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
    setFormFields(updatedFields);
  };

  /**
   * Render field preview based on type
   * @param {Object} field - Field object
   */
  const renderFieldPreview = (field) => {
    switch (field.type) {
      case 'short_text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label || 'value'}`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        );
      case 'long_text':
        return (
          <textarea
            placeholder={`Enter ${field.label || 'value'}`}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder="Enter number"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
        );
      case 'select':
        return (
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          >
            <option>Select an option</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'multi_select':
        return (
          <div className="space-y-2">
            {field.options.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" disabled />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Field Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Registration Form Fields</h3>
        <button
          type="button"
          onClick={addField}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Field</span>
        </button>
      </div>

      {/* Fields List */}
      {formFields.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg">No form fields yet</p>
          <p className="text-gray-500 text-sm mt-2">Click "Add Field" to create your first form field</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition duration-200"
            >
              {/* Field Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Label Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      placeholder="e.g., Full Name, T-Shirt Size"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {field.error && field.error.includes('Label') && (
                      <p className="text-red-500 text-sm mt-1">{field.error}</p>
                    )}
                  </div>

                  {/* Type Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {fieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex space-x-2 ml-4">
                  <button
                    type="button"
                    onClick={() => moveFieldUp(index)}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition duration-200 ${
                      index === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Move up"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFieldDown(index)}
                    disabled={index === formFields.length - 1}
                    className={`p-2 rounded-lg transition duration-200 ${
                      index === formFields.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Move down"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition duration-200"
                    title="Delete field"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Required Checkbox */}
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, 'required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Required field</span>
                </label>
              </div>

              {/* Options Input (for select/multi_select) */}
              {(field.type === 'select' || field.type === 'multi_select') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (comma-separated) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field.options.join(', ')}
                    onChange={(e) => updateField(index, 'options', e.target.value)}
                    placeholder="e.g., Small, Medium, Large, XL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {field.error && field.error.includes('Options') && (
                    <p className="text-red-500 text-sm mt-1">{field.error}</p>
                  )}
                </div>
              )}

              {/* Field Preview */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {field.label || 'Field Label'}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldPreview(field)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
