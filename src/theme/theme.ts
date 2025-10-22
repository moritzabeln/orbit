
const Spacing = {
    Borders: {
        Md: 8,
    },
    Gap: {
        Md: 16,
    },
};


const Colors = {
    Primary: '#1F2937', // dark blue-gray
    Secondary: '#374151', // slightly lighter dark
    Accent: '#10B981', // teal accent
    Background: '#111827', // true dark background
    Border: '#4B5563', // muted border color
    Text: '#F3F4F6', // light text
    TextOnAccent: '#F3F4F6', // white text for accent backgrounds
};


const Component = {
    ContainerHorizontal: {
        paddingHorizontal: Spacing.Gap.Md,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Spacing.Borders.Md,
        backgroundColor: Colors.Background,
        borderColor: Colors.Border,
        borderWidth: 1,
    },
};

const theme = {
    Spacing,
    Colors,
    Component,
};

export default theme;
