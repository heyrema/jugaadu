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

module.exports = {
	validateTemplate
};