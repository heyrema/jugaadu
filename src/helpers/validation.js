const {
	validateImage,
	getImageLocation
} = require('./image');
const {
	isValidPlaceholder
} = require('./placeholder');

const validateTemplate = async body => {
	if (!await validateImage(body.background))
		throw new Error(`Invalid value for certificate background: Image not found!`);
	
	const imgLocation = await getImageLocation(body.background);
	if (!imgLocation)
		throw new Error(`Invalid value for background: Image not accessible!`);

	body.background = imgLocation;

	if (body.fields == null)
		throw new Error(`Invalid value for fields!`);

	for (const field of body.fields) {
		if (body.fields.filter(f => f.name === field.name).length > 1)
			throw new Error(`Duplicate fields named '${field.name}' received!`);

		if (field.type == null)
			field.type = 'String';

		if (['Number', 'Boolean', 'String', 'Image', 'Date'].indexOf(field.type) < 0)
			throw new Error(`Invalid type for field '${field.name}': Only Number, Boolean, String, Image, and Date allowed.`);
		
		if (['TITLE', 'template', 'uid', '_id'].indexOf(field.name) >= 0)
			throw new Error(`Invalid name for field '${field.name}': Name not allowed for fields.`);

		if ((field.fixed || field.placeholder) && field.value == null)
			throw new Error(`Fixed field '${field.name}' cannot have an empty value.`);

		if (field.placeholder)
			if (!isValidPlaceholder(field))
				throw new Error(`Field '${field.name}' is an invalid placeholder!`);
			else
				continue;

		if (field.type === 'Image') {
			if (field.image == null)
				throw new Error(`Invalid value for field '${field.name}': An expected size must be defined.`);

			const { value, defaultValue } = field ?? {};
			if (value != null && !await validateImage(value))
				throw new Error(`Invalid value for field '${field.name}': Image not found!`);
			
			if (value != null) {
				const imgLocation = await getImageLocation(value);
				if (!imgLocation)
					throw new Error(`Invalid value for field '${field.name}': Image not accessible!`);
				
				field.value = imgLocation;
			}

			if (defaultValue != null && !await validateImage(defaultValue))
				throw new Error(`Invalid default value for field '${field.name}': Image not found!`);
			
			if (defaultValue != null) {
				const imgLocation = await getImageLocation(defaultValue);
				if (!imgLocation)
					throw new Error(`Invalid default value for field '${field.name}': Image not accessible!`);
				
				field.defaultValue = imgLocation;
			}
		} else {
			if (field.textFormat == null)
				field.textFormat = {};

			// Text fields
			const {
				style
			} = field.textFormat;

			if (style != null && style?.type == 'gradient' && (style.gradient == null || style.gradient.stops?.length < 2))
				throw new Error(`Invalid style for field '${field.name}': Invalid gradient configuration!`);
		}

		if (field.type === 'Date') {
			const { value, defaultValue } = field ?? {};

			if (value != null) {
				if (value === 'now') {
					field.value = new Date(Date.now());
				} else {
					try {
						new Date(Date.parse(value)).toISOString();
					} catch(e) {
						throw new Error(`Invalid value for field '${field.name}': Invalid date! Use the UTC/ISO format.`);
					}
				}
			}

			if (defaultValue != null) {
				if (defaultValue === 'now') {
					field.defaultValue = new Date(Date.now());
				} else {
					try {
						new Date(Date.parse(defaultValue)).toISOString();
					} catch(e) {
						throw new Error(`Invalid value for field '${field.name}': Invalid date! Use the UTC/ISO format.`);
					}
				}
			}
		}
	}
};

const validateCertificate = async (body, template) => {
	const { values } = body;

	if (values.filter(v => v?.value == null && v?.visible !== false).length > 0)
		throw new Error(`Empty values not allowed!`);

	if (template == null)
		throw new Error(`Template not found!`);

	const validValues = [];

	for (const field of template.fields) {
		const {
			name,
			type,
			defaultValue,
			required,
			fixed,
		} = field;

		const matches = values.filter(v => v.name === name);
		if (matches.length > 1)
			throw new Error(`Duplicate values for the field '${name}' received!`);

		const newField = matches[0];

		let visible = true;
		if ('visible' in (newField ?? {}))
			visible = newField.visible;

		if (newField?.visible === false)
			newField.value = getDefaultValue[type];

		if (field.placeholder) {
			if (visible !== false)
				continue;
				
			newField.value = field.value;
			validValues.push({ ...newField });
			continue;
		}

		// Check if required and missing
		if (
			(newField == null || newField.value == null)
			&& required
			&& defaultValue == null
		)
			throw new Error(`Received no value for field '${name}'!`);
			
		if (newField == null || fixed)
			continue;
		
		let { value: newValue } = newField ?? {};
		
		switch (type) {
			case 'Number': {
				if (typeof newValue !== 'number')
					throw new Error(`Only numbers accepted for '${name}'!`);
			}
			break;
			case 'String': {
				if (typeof newValue !== 'string')
					throw new Error(`Only strings accepted for '${name}'!`);
			}
			break;
			case 'Boolean': {
				if (typeof newValue !== 'boolean')
					throw new Error(`Only booleans accepted for '${name}'!`);
			}
			break;
			case 'Date': {
				if (newValue === 'now')
					newValue = new Date(Date.now());
				try {
					new Date(Date.parse(newValue)).toISOString();
				} catch(e) {
					throw new Error(`Invalid value for field '${name}': Invalid date! Use the UTC/ISO format.`);
				}
			}
			break;
			case 'Image': {
				if (newValue != null && !await validateImage(newValue))
					throw new Error(`Invalid value for field '${name}': Image not found!`);
				
				if (newValue != null) {
					const imgLocation = await getImageLocation(newValue);
					if (!imgLocation)
						throw new Error(`Invalid value for field '${name}': Image not accessible!`);
					
					newValue = imgLocation;
				}
			}
			break;
		}

		validValues.push({
			name,
			value: newValue,
			visible
		});
	}

	body.values = validValues;
	return body;
};

module.exports = {
	validateTemplate,
	validateCertificate
};