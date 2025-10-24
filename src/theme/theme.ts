
const Spacing = {
    Borders: {
        Md: 8,
    },
    Gap: {
        Md: 16,
        Lg: 24,
    },
};


const Colors = {
    Accent: '#10B981', // teal accent
    Background: {
        Menu: '#0c0f15ff', // dark blue for menus
        Primary: '#0d1018ff', // true dark background
        Secondary: '#1F2937', // slightly lighter background
    },
    Border: '#4B5563', // muted border color
    Text: {
        Primary: '#F3F4F6', // light text
        Secondary: '#9CA3AF', // muted gray for secondary text
    },
    TextOnAccent: '#F3F4F6', // white text for accent backgrounds
};


const Component = {
    ContainerHorizontal: {
        paddingHorizontal: Spacing.Gap.Md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    PageContainer: {
        flex: 1,
        backgroundColor: Colors.Background.Primary,
    },
    PageInnerContainer: {
        flex: 1,
        padding: Spacing.Gap.Lg,
    },
    Card: {
        backgroundColor: Colors.Background.Secondary,
        borderWidth: 1,
        borderColor: Colors.Border,
        borderRadius: Spacing.Borders.Md,
        padding: Spacing.Gap.Md,
        marginBottom: Spacing.Gap.Md,
    },
};

const theme = {
    Spacing,
    Colors,
    Component,
};

export default theme;
