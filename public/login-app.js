const appView = document.querySelector("#app-view");
const formContent = document.querySelector(".form-content");
const modalContainer = document.querySelector("#modal-container");
const toastContainer = document.querySelector("#toast-container");

let rememberSession = false;
let currentUser = null;
let currentDashboardData = null;
let activeTab = "overview";
let currentLanguage = "en";
let currentScreen = "login";
let lastScreenArgs = [];
let selectedLoginRole = "customer";
let cachedAuthStatus = { emailVerificationConfigured: true, demoMode: true };

const i18n = {
  en: {
    hero_guest_eyebrow: "THE MOM'S KID HOTEL EXPERIENCE",
    hero_guest_title: "Welcome to your home away from home.",
    hero_guest_caption: "Warm hospitality, thoughtful details, and a stay worth remembering.",
    hero_admin_eyebrow: "THE GENERAL MANAGER'S SUITE",
    hero_admin_title: "The whole hotel, in view.",
    hero_admin_caption: "A clear command center for people, performance, security, and the details behind every great stay.",
    hero_manager_eyebrow: "THE OPERATIONS LOUNGE",
    hero_manager_title: "A well-run stay starts here.",
    hero_manager_caption: "Bring the team together and keep guest operations moving with confidence and care.",
    hero_staff_eyebrow: "THE GUEST SERVICES DESK",
    hero_staff_title: "Every thoughtful touch matters.",
    hero_staff_caption: "Your service workspace keeps the guest directory close and the spirit of hospitality front and center.",
    hero_customer_eyebrow: "YOUR PRIVATE GUEST PORTAL",
    hero_customer_title: "Your stay, made personal.",
    hero_customer_caption: "A welcoming place to find your account details and feel at home before you arrive.",

    pref_restore: "Restore Defaults",
    pref_restore_title: "Restore system preferences (theme, display mode, time format, language) without altering any data",
    pref_restore_confirm: "Restore system preferences (display mode, language, time format) to factory defaults?\n\n(Note: All user accounts, rooms, and booking records will remain completely untouched.)",
    mode_auto: "Auto Mode",
    mode_light: "Light Mode",
    mode_dark: "Dark Mode",
    time_12h: "12-Hour",
    time_24h: "24-Hour",

    role_guest: "Guest",
    role_staff: "Staff",
    role_manager: "Manager",
    role_admin: "Admin",
    role_title_admin: "Hotel Administrator",
    role_title_manager: "Hotel Operations Manager",
    role_title_staff: "Guest Services Staff",
    role_title_customer: "Valued Hotel Guest",

    login_eyebrow: "Guest & Team Access",
    login_title: "Welcome back.",
    login_intro: "Sign in to MOM'S KID HOTEL. Select your portal account type and enter your credentials.",
    login_2fa_badge: "Two-Factor Authentication (2FA) active for account protection.",
    login_demo_title: "Instant 2FA Demo Mode Active",
    login_demo_desc: "Live email delivery is unconfigured. Your 6-digit verification code will be displayed directly on screen for seamless sign-in.",
    field_account_type: "Account type",
    field_email: "Email address",
    field_password: "Password",
    btn_show: "Show",
    btn_hide: "Hide",
    remember_device: "Remember this device",
    forgot_password: "Forgot password?",
    btn_signin: "Sign in to Portal",
    new_guest_prompt: "New guest to MOM'S KID HOTEL?",
    btn_create_account: "Create a Guest Account",

    forgot_eyebrow: "Account Recovery",
    forgot_title: "Reset your password.",
    forgot_intro: "Enter the email address registered with your account. We will issue a 10-minute password reset code.",
    btn_send_reset: "Send Reset Code",
    btn_back_login: "Back to Sign In",

    reset_eyebrow: "Secure Password Reset",
    reset_title: "Create new password.",
    reset_intro: "Enter the six-digit reset code and choose a new password of at least 12 characters.",
    reset_demo_title: "Instant Reset Code (Demo Mode)",
    btn_autofill: "⚡ Auto-Fill Code",
    field_reset_code: "Password reset code",
    field_new_password: "New password",
    field_confirm_password: "Confirm new password",
    placeholder_min12: "Minimum 12 characters",
    placeholder_reenter: "Re-enter new password",
    btn_update_password: "Update Password",

    register_eyebrow: "Guest Registration",
    register_title: "Create your account.",
    register_intro: "Join MOM'S KID HOTEL as a registered guest. Enjoy easy room booking, special requests, and reservation tracking.",
    field_create_password: "Create password",
    btn_register_submit: "Create Guest Account",

    otp_eyebrow: "Two-Factor Authentication",
    otp_title: "Verify your identity.",
    otp_intro: "A six-digit security code was issued for {dest}. Please check your email inbox (including Spam/Junk folder) and enter it below to unlock your dashboard.",
    otp_demo_title: "Instant 2FA Code (Demo Mode)",
    field_otp_code: "Enter 6-digit verification code",
    btn_verify_enter: "Verify & Enter Portal",
    btn_resend_code: "Resend Verification Code",
    otp_hint_title: "Didn't receive the code?",
    otp_hint_spam: "Please check your Spam or Junk mail folder.",
    otp_hint_terminal: "In local development, the 6-digit code is also logged directly in your server terminal.",

    btn_logout: "Sign out",
    admin_heading_title: "General Manager's Suite",
    admin_heading_intro: "Complete oversight of hotel operations, room inventory, reservations, accounts, and system integrity.",
    manager_heading_title: "Operations Lounge",
    manager_heading_intro: "Coordinate daily hotel operations, guest services, room inventory, and team activities.",
    staff_heading_title: "Guest Services & Front Desk",
    staff_heading_intro: "Front-line guest reception, quick check-in / check-out, and room availability.",
    customer_heading_title: "Your Guest Experience",
    customer_heading_intro: "Welcome to MOM'S KID HOTEL. View your reservations, browse available suites, and book your next stay.",

    tab_overview: "Overview",
    tab_rooms: "Rooms & Suites",
    tab_bookings: "Reservations",
    tab_users: "Active Accounts",
    tab_deleted_users: "Archived Accounts",
    tab_audit: "Security & Audit",
    tab_backups: "Encrypted Backups",
    tab_catalog: "Browse & Book Rooms",
    tab_profile: "Account & Security",
    tab_frontdesk: "Front Desk & Check-in",
    tab_customers: "Customer Directory",
    tab_team: "Team Members",
    tab_my_stays: "My Stays & Bookings",

    metric_total_rooms: "Total Rooms",
    metric_occupied_rooms: "Occupied Rooms",
    metric_confirmed_stays: "Confirmed Stays",
    metric_in_house: "In-House Guests",
    metric_active_users: "Active Users",
    metric_archived_users: "Archived Users",
    metric_upcoming_stays: "Upcoming Stays",
    metric_staff_members: "Staff Members",
    metric_pending_checkins: "Pending Check-ins",
    metric_rooms_cleaning: "Rooms Cleaning",
    metric_2fa_status: "2FA Security",
    metric_active: "Active",

    sec_quick_ops: "Quick Operations",
    sec_recent_reservations: "Recent Reservations",
    sec_room_directory: "Room Directory & Availability",
    sec_all_reservations: "All Guest Reservations",
    sec_active_accounts: "Active Accounts Directory",
    sec_create_account: "Create a New Staff, Manager, or Customer Account",
    sec_deleted_archive: "Deleted Accounts Archive (Permanent Historical Audit)",
    sec_audit_log: "Audit Log & Security Activity",
    sec_encrypted_backups: "Encrypted Database Backups",
    sec_todays_arrivals: "Today's Arrivals & Front Desk",
    sec_room_inventory: "Room Inventory & Cleanliness Status",
    sec_guest_reservations: "Guest Reservations",
    sec_team_directory: "Team Directory",
    sec_add_staff: "Add Staff or Customer Account",
    sec_operational_audit: "Operational Audit Activity",
    sec_quick_queue: "Quick Check-in & Departure Queue",
    sec_live_availability: "Live Room Availability",
    sec_reservations_directory: "Reservations Directory",
    sec_customer_directory: "Registered Customers",
    sec_your_reservations: "Your Reservations",
    sec_available_rooms: "Available Rooms & Suites",
    sec_account_credentials: "Account Credentials & Access",

    quick_view_reservations: "View All Reservations",
    quick_manage_rooms: "Manage Room Inventory",
    quick_create_account: "Provision New Account",
    quick_view_archive: "View Archived Deleted Accounts",
    btn_explore_rooms: "Explore Rooms & Book a Stay",

    search_accounts_placeholder: "Filter accounts by email or role…",
    hint_active_users: "total active users",
    empty_accounts: "No accounts found.",
    th_id: "ID",
    th_email: "Email",
    th_role: "Role / Access",
    th_created: "Created",
    th_actions: "Actions",
    hint_protected_admin: "Protected admin",
    btn_archive_delete: "Archive & Delete",
    btn_save: "Save",

    search_deleted_placeholder: "Search deleted accounts…",
    hint_archived_accounts: "archived accounts",
    empty_deleted_archive: "No accounts in the deleted archive. When an admin deletes a user, the historical record will be preserved here.",
    th_archive_num: "Archive #",
    th_orig_id: "Original ID",
    th_orig_role: "Original Role",
    th_deleted_at: "Deleted At",
    th_deleted_by: "Deleted By",
    th_reason: "Reason",

    search_rooms_placeholder: "Search rooms by number, type, amenities…",
    btn_add_room: "+ Add New Room",
    th_room_num: "Room #",
    th_room_type: "Type",
    th_price_night: "Price / Night",
    th_capacity: "Capacity",
    th_amenities: "Amenities",
    th_status: "Status",
    btn_change_status: "Change Status",
    btn_delete: "Delete",

    search_bookings_placeholder: "Search by booking ref, guest name, or room…",
    hint_reservations: "reservations",
    empty_bookings: "No reservations recorded yet.",
    th_booking_ref: "Reference",
    th_guest_contact: "Guest Name & Contact",
    th_room: "Room",
    th_dates: "Dates",
    th_total_price: "Total Price",
    btn_checkin: "Check In",
    btn_checkout: "Check Out",
    btn_cancel: "Cancel",
    btn_reserve_room: "Reserve Room",
    price_per_night: "/ night",
    guests_suffix: "guests",

    search_audit_placeholder: "Search security log…",
    empty_audit: "No activity recorded yet.",
    th_audit_action: "Event Action",
    th_audit_actor_subject: "Actor & Subject",
    th_audit_datetime: "Date & Time",

    field_temp_password: "Temporary password",
    field_entity: "Entity",
    hint_temp_password: "At least 12 characters. The account must verify its email at first login.",
    btn_create_account_submit: "Create account",

    btn_trigger_backup: "Trigger Encrypted Backup Now",
    backup_desc_auto: "Encrypted local snapshots run automatically every 24 hours.",
    backup_cloud_enabled: "Online AWS S3 backup copy is enabled.",
    backup_cloud_disabled: "Local encrypted backups active. To enable cloud copies, configure AWS S3 environment settings.",

    modal_book_title: "Book Room {number}",
    modal_book_name: "Guest Full Name",
    modal_book_email: "Guest Email Address",
    modal_book_phone: "Phone Number (optional)",
    modal_book_checkin: "Check-in Date",
    modal_book_checkout: "Check-out Date",
    modal_book_guests: "Number of Guests",
    modal_book_requests: "Special Requests (optional)",
    modal_book_submit: "Confirm & Book Reservation",

    modal_add_room_title: "Add New Room",
    modal_room_num: "Room Number",
    modal_room_type: "Room Type / Title",
    modal_price_night: "Price / Night ($)",
    modal_capacity: "Max Capacity",
    modal_amenities: "Amenities",
    modal_initial_status: "Initial Status",
    modal_desc: "Description",
    modal_create_room_submit: "Create Room",

    modal_edit_status_title: "Update Room {number} Status",
    modal_select_new_status: "Select New Room Status",
    modal_update_status_submit: "Update Room Status",

    modal_delete_user_title: "Archive & Delete Account",
    modal_delete_user_prompt: "Are you sure you want to permanently delete the {role} account for {email}?",
    modal_delete_archive_guarantee: "Permanent Archive Guarantee:",
    modal_delete_archive_info: "This account will be removed from active access, all active sessions and pending OTPs will be immediately invalidated, and a permanent record will be stored in the Deleted Accounts Archive with your admin email and timestamp.",
    modal_delete_reason: "Reason for Account Deletion",
    modal_delete_submit: "Permanently Archive & Delete",
    modal_cancel: "Cancel",

    status_available: "Available",
    status_occupied: "Occupied",
    status_cleaning: "Cleaning",
    status_maintenance: "Maintenance",
    status_confirmed: "confirmed",
    status_checked_in: "checked-in",
    status_checked_out: "checked-out",
    status_cancelled: "cancelled",

    label_registered_email: "Registered Email",
    msg_passwords_mismatch: "Those passwords do not match.",
    toast_lang_set: "Language set to {lang}",
    toast_time_set: "Time format set to {format}",
    toast_prefs_restored: "System preferences restored to default.",
  },

  fr: {
    hero_guest_eyebrow: "L'EXPÉRIENCE MOM'S KID HOTEL",
    hero_guest_title: "Bienvenue dans votre deuxième maison.",
    hero_guest_caption: "Une hospitalité chaleureuse, des détails soignés et un séjour inoubliable.",
    hero_admin_eyebrow: "LA SUITE DE LA DIRECTION GÉNÉRALE",
    hero_admin_title: "Tout l'hôtel sous vos yeux.",
    hero_admin_caption: "Un centre de pilotage complet pour les équipes, la performance, la sécurité et l'excellence de chaque séjour.",
    hero_manager_eyebrow: "LE SALON DES OPÉRATIONS",
    hero_manager_title: "Un séjour réussi commence ici.",
    hero_manager_caption: "Fédérez les équipes et assurez le bon déroulement des opérations avec professionnalisme et bienveillance.",
    hero_staff_eyebrow: "LE BUREAU DU SERVICE CLIENT",
    hero_staff_title: "Chaque attention compte.",
    hero_staff_caption: "Votre espace de travail garde le répertoire des clients à portée de main au cœur de l'hospitalité.",
    hero_customer_eyebrow: "VOTRE PORTAIL CLIENT PRIVÉ",
    hero_customer_title: "Votre séjour, personnalisé.",
    hero_customer_caption: "Un espace accueillant pour retrouver vos réservations et vous sentir chez vous dès votre arrivée.",

    pref_restore: "Rétablir les valeurs par défaut",
    pref_restore_title: "Rétablir les préférences système (thème, mode d'affichage, format de l'heure, langue) sans modifier les données",
    pref_restore_confirm: "Rétablir les préférences système (mode d'affichage, langue, format d'heure) par défaut ?\n\n(Remarque : tous les comptes utilisateurs, chambres et réservations resteront intacts.)",
    mode_auto: "Mode Auto",
    mode_light: "Mode Clair",
    mode_dark: "Mode Sombre",
    time_12h: "Format 12h",
    time_24h: "Format 24h",

    role_guest: "Client",
    role_staff: "Équipe",
    role_manager: "Responsable",
    role_admin: "Admin",
    role_title_admin: "Administrateur de l'hôtel",
    role_title_manager: "Responsable des opérations",
    role_title_staff: "Équipe réception & services",
    role_title_customer: "Client privilégié",

    login_eyebrow: "Accès Clients & Équipe",
    login_title: "Bienvenue.",
    login_intro: "Connectez-vous à MOM'S KID HOTEL. Sélectionnez votre type de compte et saisissez vos identifiants.",
    login_2fa_badge: "Authentification à deux facteurs (2FA) active pour protéger votre compte.",
    login_demo_title: "Mode Démo 2FA Instantané Actif",
    login_demo_desc: "La livraison par e-mail en direct n'est pas configurée. Votre code de vérification à 6 chiffres s'affichera directement à l'écran.",
    field_account_type: "Type de compte",
    field_email: "Adresse e-mail",
    field_password: "Mot de passe",
    btn_show: "Afficher",
    btn_hide: "Masquer",
    remember_device: "Mémoriser cet appareil",
    forgot_password: "Mot de passe oublié ?",
    btn_signin: "Se connecter au portail",
    new_guest_prompt: "Nouveau client chez MOM'S KID HOTEL ?",
    btn_create_account: "Créer un compte client",

    forgot_eyebrow: "Récupération de compte",
    forgot_title: "Réinitialisez votre mot de passe.",
    forgot_intro: "Saisissez l'adresse e-mail associée à votre compte. Nous vous enverrons un code de réinitialisation valable 10 minutes.",
    btn_send_reset: "Envoyer le code",
    btn_back_login: "Retour à la connexion",

    reset_eyebrow: "Réinitialisation sécurisée",
    reset_title: "Créer un nouveau mot de passe.",
    reset_intro: "Saisissez le code à six chiffres et choisissez un nouveau mot de passe d'au moins 12 caractères.",
    reset_demo_title: "Code instantané (Mode Démo)",
    btn_autofill: "⚡ Remplir automatiquement le code",
    field_reset_code: "Code de réinitialisation",
    field_new_password: "Nouveau mot de passe",
    field_confirm_password: "Confirmer le mot de passe",
    placeholder_min12: "Minimum 12 caractères",
    placeholder_reenter: "Retapez le nouveau mot de passe",
    btn_update_password: "Mettre à jour le mot de passe",

    register_eyebrow: "Inscription Client",
    register_title: "Créez votre compte.",
    register_intro: "Rejoignez MOM'S KID HOTEL en tant que client privilégié. Profitez de réservations simplifiées et du suivi de vos séjours.",
    field_create_password: "Créer un mot de passe",
    btn_register_submit: "Créer un compte client",

    otp_eyebrow: "Authentification à deux facteurs",
    otp_title: "Vérifiez votre identité.",
    otp_intro: "Un code de sécurité à six chiffres a été envoyé à {dest}. Veuillez consulter votre boîte de réception (y compris vos spams) et le saisir ci-dessous.",
    otp_demo_title: "Code 2FA instantané (Mode Démo)",
    field_otp_code: "Saisissez le code à 6 chiffres",
    btn_verify_enter: "Vérifier & Accéder au portail",
    btn_resend_code: "Renvoyer le code de vérification",
    otp_hint_title: "Vous n'avez pas reçu le code ?",
    otp_hint_spam: "Veuillez vérifier votre dossier Courrier indésirable / Spam.",
    otp_hint_terminal: "En développement local, le code à 6 chiffres est également affiché dans le terminal du serveur.",

    btn_logout: "Se déconnecter",
    admin_heading_title: "Suite de la Direction Générale",
    admin_heading_intro: "Supervision complète des opérations hôtelières, des chambres, des réservations, des comptes et de la sécurité du système.",
    manager_heading_title: "Salon des Opérations",
    manager_heading_intro: "Coordonnez les opérations hôtelières quotidiennes, le service client, l'inventaire des chambres et l'équipe.",
    staff_heading_title: "Réception & Service Client",
    staff_heading_intro: "Accueil des clients, arrivées et départs rapides, et disponibilité des chambres en temps réel.",
    customer_heading_title: "Votre Expérience Séjour",
    customer_heading_intro: "Bienvenue chez MOM'S KID HOTEL. Consultez vos réservations, explorez nos suites et réservez votre prochain séjour.",

    tab_overview: "Vue d'ensemble",
    tab_rooms: "Chambres & Suites",
    tab_bookings: "Réservations",
    tab_users: "Comptes actifs",
    tab_deleted_users: "Comptes archivés",
    tab_audit: "Sécurité & Audit",
    tab_backups: "Sauvegardes chiffrées",
    tab_catalog: "Parcourir & Réserver",
    tab_profile: "Compte & Sécurité",
    tab_frontdesk: "Réception & Arrivées",
    tab_customers: "Répertoire clients",
    tab_team: "Membres de l'équipe",
    tab_my_stays: "Mes Séjours & Réservations",

    metric_total_rooms: "Total Chambres",
    metric_occupied_rooms: "Chambres occupées",
    metric_confirmed_stays: "Séjours confirmés",
    metric_in_house: "Clients sur place",
    metric_active_users: "Utilisateurs actifs",
    metric_archived_users: "Utilisateurs archivés",
    metric_upcoming_stays: "Séjours à venir",
    metric_staff_members: "Membres de l'équipe",
    metric_pending_checkins: "Arrivées en attente",
    metric_rooms_cleaning: "Chambres en nettoyage",
    metric_2fa_status: "Sécurité 2FA",
    metric_active: "Actif",

    sec_quick_ops: "Opérations rapides",
    sec_recent_reservations: "Réservations récentes",
    sec_room_directory: "Répertoire & Disponibilité des chambres",
    sec_all_reservations: "Toutes les réservations",
    sec_active_accounts: "Répertoire des comptes actifs",
    sec_create_account: "Créer un nouveau compte",
    sec_deleted_archive: "Archive des comptes supprimés (Audit permanent)",
    sec_audit_log: "Journal d'audit & Activité de sécurité",
    sec_encrypted_backups: "Sauvegardes de base de données chiffrées",
    sec_todays_arrivals: "Arrivées du jour & Réception",
    sec_room_inventory: "Inventaire des chambres & État de propreté",
    sec_guest_reservations: "Réservations des clients",
    sec_team_directory: "Annuaire de l'équipe",
    sec_add_staff: "Ajouter un compte employé ou client",
    sec_operational_audit: "Activité d'audit opérationnel",
    sec_quick_queue: "File d'attente arrivées & départs",
    sec_live_availability: "Disponibilité des chambres en temps réel",
    sec_reservations_directory: "Répertoire des réservations",
    sec_customer_directory: "Clients enregistrés",
    sec_your_reservations: "Vos réservations",
    sec_available_rooms: "Chambres & Suites disponibles",
    sec_account_credentials: "Identifiants du compte & Accès",

    quick_view_reservations: "Voir toutes les réservations",
    quick_manage_rooms: "Gérer l'inventaire des chambres",
    quick_create_account: "Créer un nouveau compte",
    quick_view_archive: "Voir les comptes archivés",
    btn_explore_rooms: "Explorer les chambres & Réserver",

    search_accounts_placeholder: "Filtrer les comptes par e-mail ou rôle…",
    hint_active_users: "utilisateurs actifs",
    empty_accounts: "Aucun compte trouvé.",
    th_id: "ID",
    th_email: "E-mail",
    th_role: "Rôle / Accès",
    th_created: "Créé le",
    th_actions: "Actions",
    hint_protected_admin: "Admin protégé",
    btn_archive_delete: "Archiver & Supprimer",
    btn_save: "Enregistrer",

    search_deleted_placeholder: "Rechercher dans les comptes archivés…",
    hint_archived_accounts: "comptes archivés",
    empty_deleted_archive: "Aucun compte dans l'archive. Lorsqu'un administrateur supprime un utilisateur, son historique est conservé ici.",
    th_archive_num: "Archive N°",
    th_orig_id: "ID Origine",
    th_orig_role: "Rôle Origine",
    th_deleted_at: "Supprimé le",
    th_deleted_by: "Supprimé par",
    th_reason: "Motif",

    search_rooms_placeholder: "Rechercher une chambre par numéro, type, équipement…",
    btn_add_room: "+ Ajouter une chambre",
    th_room_num: "Chambre N°",
    th_room_type: "Type",
    th_price_night: "Prix / Nuit",
    th_capacity: "Capacité",
    th_amenities: "Équipements",
    th_status: "État",
    btn_change_status: "Modifier l'état",
    btn_delete: "Supprimer",

    search_bookings_placeholder: "Rechercher par référence, nom ou chambre…",
    hint_reservations: "réservations",
    empty_bookings: "Aucune réservation enregistrée.",
    th_booking_ref: "Référence",
    th_guest_contact: "Nom du client & Contact",
    th_room: "Chambre",
    th_dates: "Dates",
    th_total_price: "Prix total",
    btn_checkin: "Enregistrer l'arrivée",
    btn_checkout: "Enregistrer le départ",
    btn_cancel: "Annuler",
    btn_reserve_room: "Réserver cette chambre",
    price_per_night: "/ nuit",
    guests_suffix: "personnes",

    search_audit_placeholder: "Rechercher dans le journal de sécurité…",
    empty_audit: "Aucune activité enregistrée.",
    th_audit_action: "Action de l'événement",
    th_audit_actor_subject: "Auteur & Cible",
    th_audit_datetime: "Date & Heure",

    field_temp_password: "Mot de passe temporaire",
    field_entity: "Entité",
    hint_temp_password: "Au moins 12 caractères. Le compte devra vérifier son e-mail à la première connexion.",
    btn_create_account_submit: "Créer le compte",

    btn_trigger_backup: "Déclencher la sauvegarde maintenant",
    backup_desc_auto: "Les sauvegardes chiffrées locales s'exécutent automatiquement toutes les 24 heures.",
    backup_cloud_enabled: "La copie de sauvegarde en ligne AWS S3 est activée.",
    backup_cloud_disabled: "Sauvegardes chiffrées locales actives. Pour activer les copies cloud, configurez AWS S3.",

    modal_book_title: "Réserver la chambre {number}",
    modal_book_name: "Nom complet du client",
    modal_book_email: "Adresse e-mail du client",
    modal_book_phone: "Numéro de téléphone (optionnel)",
    modal_book_checkin: "Date d'arrivée",
    modal_book_checkout: "Date de départ",
    modal_book_guests: "Nombre de personnes",
    modal_book_requests: "Demandes particulières (optionnel)",
    modal_book_submit: "Confirmer & Réserver",

    modal_add_room_title: "Ajouter une chambre",
    modal_room_num: "Numéro de chambre",
    modal_room_type: "Type / Titre de la chambre",
    modal_price_night: "Prix / Nuit ($)",
    modal_capacity: "Capacité maximale",
    modal_amenities: "Équipements",
    modal_initial_status: "État initial",
    modal_desc: "Description",
    modal_create_room_submit: "Créer la chambre",

    modal_edit_status_title: "Modifier l'état de la chambre {number}",
    modal_select_new_status: "Sélectionner le nouvel état",
    modal_update_status_submit: "Mettre à jour l'état",

    modal_delete_user_title: "Archiver & Supprimer le compte",
    modal_delete_user_prompt: "Êtes-vous sûr de vouloir supprimer définitivement le compte {role} pour {email} ?",
    modal_delete_archive_guarantee: "Garantie d'archivage permanent :",
    modal_delete_archive_info: "Ce compte sera immédiatement révoqué, toutes les sessions actives invalidées, et un enregistrement permanent conservé dans l'Archive des comptes supprimés.",
    modal_delete_reason: "Motif de suppression du compte",
    modal_delete_submit: "Archiver & Supprimer définitivement",
    modal_cancel: "Annuler",

    status_available: "Disponible",
    status_occupied: "Occupée",
    status_cleaning: "En nettoyage",
    status_maintenance: "En maintenance",
    status_confirmed: "confirmée",
    status_checked_in: "en séjour",
    status_checked_out: "terminé",
    status_cancelled: "annulée",

    label_registered_email: "E-mail enregistré",
    msg_passwords_mismatch: "Les mots de passe ne correspondent pas.",
    toast_lang_set: "Langue définie sur {lang}",
    toast_time_set: "Format d'heure défini sur {format}",
    toast_prefs_restored: "Préférences système rétablies par défaut.",
  },

  es: {
    hero_guest_eyebrow: "LA EXPERIENCIA MOM'S KID HOTEL",
    hero_guest_title: "Bienvenido a su segundo hogar.",
    hero_guest_caption: "Cálida hospitalidad, detalles bien pensados y una estancia inolvidable.",
    hero_admin_eyebrow: "LA SUITE DEL DIRECTOR GENERAL",
    hero_admin_title: "Todo el hotel a la vista.",
    hero_admin_caption: "Un centro de control completo para el personal, el rendimiento, la seguridad y la excelencia de cada estancia.",
    hero_manager_eyebrow: "EL SALÓN DE OPERACIONES",
    hero_manager_title: "Una estancia perfecta comienza aquí.",
    hero_manager_caption: "Coordine al equipo y gestione las operaciones con confianza y atención al detalle.",
    hero_staff_eyebrow: "EL MOSTRADOR DE ATENCIÓN AL CLIENTE",
    hero_staff_title: "Cada detalle cuenta.",
    hero_staff_caption: "Su espacio de trabajo mantiene el directorio de huéspedes a mano y la hospitalidad en primer plano.",
    hero_customer_eyebrow: "SU PORTAL PRIVADO DE HUÉSPED",
    hero_customer_title: "Su estancia, a su medida.",
    hero_customer_caption: "Un espacio acogedor para consultar su cuenta y sentirse como en casa antes de su llegada.",

    pref_restore: "Restaurar valores predeterminados",
    pref_restore_title: "Restaurar las preferencias del sistema (tema, modo, formato de hora, idioma) sin alterar datos",
    pref_restore_confirm: "¿Restaurar las preferencias del sistema (modo de pantalla, idioma, formato de hora) a los valores predeterminados?\n\n(Nota: Todas las cuentas de usuario, habitaciones y reservas permanecerán intactas).",
    mode_auto: "Modo Automático",
    mode_light: "Modo Claro",
    mode_dark: "Modo Oscuro",
    time_12h: "Formato 12h",
    time_24h: "Formato 24h",

    role_guest: "Huésped",
    role_staff: "Personal",
    role_manager: "Gerente",
    role_admin: "Admin",
    role_title_admin: "Administrador del hotel",
    role_title_manager: "Gerente de operaciones",
    role_title_staff: "Personal de recepción y servicios",
    role_title_customer: "Huésped distinguido",

    login_eyebrow: "Acceso de Huéspedes y Equipo",
    login_title: "Bienvenido de nuevo.",
    login_intro: "Inicie sesión en MOM'S KID HOTEL. Seleccione su tipo de cuenta e ingrese sus credenciales.",
    login_2fa_badge: "Autenticación de dos factores (2FA) activa para la protección de su cuenta.",
    login_demo_title: "Modo Demo 2FA Instantáneo Activo",
    login_demo_desc: "La entrega de correo en vivo no está configurada. Su código de 6 dígitos se mostrará directamente en pantalla.",
    field_account_type: "Tipo de cuenta",
    field_email: "Correo electrónico",
    field_password: "Contraseña",
    btn_show: "Mostrar",
    btn_hide: "Ocultar",
    remember_device: "Recordar este dispositivo",
    forgot_password: "¿Olvidó su contraseña?",
    btn_signin: "Iniciar sesión en el portal",
    new_guest_prompt: "¿Nuevo huésped en MOM'S KID HOTEL?",
    btn_create_account: "Crear cuenta de huésped",

    forgot_eyebrow: "Recuperación de cuenta",
    forgot_title: "Restablezca su contraseña.",
    forgot_intro: "Ingrese el correo registrado en su cuenta. Le enviaremos un código válido por 10 minutos.",
    btn_send_reset: "Enviar código",
    btn_back_login: "Volver a iniciar sesión",

    reset_eyebrow: "Restablecimiento seguro",
    reset_title: "Crear nueva contraseña.",
    reset_intro: "Ingrese el código de seis dígitos y elija una nueva contraseña de al menos 12 caracteres.",
    reset_demo_title: "Código instantáneo (Modo Demo)",
    btn_autofill: "⚡ Autocompletar código",
    field_reset_code: "Código de restablecimiento",
    field_new_password: "Nueva contraseña",
    field_confirm_password: "Confirmar contraseña",
    placeholder_min12: "Mínimo 12 caracteres",
    placeholder_reenter: "Vuelva a ingresar la contraseña",
    btn_update_password: "Actualizar contraseña",

    register_eyebrow: "Registro de Huéspedes",
    register_title: "Cree su cuenta.",
    register_intro: "Únase a MOM'S KID HOTEL como huésped registrado. Disfrute de reservas sencillas y seguimiento personalizado.",
    field_create_password: "Crear contraseña",
    btn_register_submit: "Crear cuenta de huésped",

    otp_eyebrow: "Autenticación de dos factores",
    otp_title: "Verifique su identidad.",
    otp_intro: "Se emitió un código de seguridad de seis dígitos para {dest}. Revise su correo (incluido spam) e ingréselo a continuación.",
    otp_demo_title: "Código 2FA instantáneo (Modo Demo)",
    field_otp_code: "Ingrese el código de 6 dígitos",
    btn_verify_enter: "Verificar e ingresar al portal",
    btn_resend_code: "Reenviar código de verificación",
    otp_hint_title: "¿No recibió el código?",
    otp_hint_spam: "Por favor revise su carpeta de Correo no deseado o Spam.",
    otp_hint_terminal: "En desarrollo local, el código de 6 dígitos también se muestra en la terminal del servidor.",

    btn_logout: "Cerrar sesión",
    admin_heading_title: "Suite del Director General",
    admin_heading_intro: "Supervisión completa de las operaciones del hotel, inventario de habitaciones, reservaciones, cuentas y seguridad.",
    manager_heading_title: "Salón de Operaciones",
    manager_heading_intro: "Coordine las operaciones diarias del hotel, servicios a huéspedes, inventario y actividades del equipo.",
    staff_heading_title: "Recepción y Atención al Huésped",
    staff_heading_intro: "Atención directa a huéspedes, registro rápido de entrada/salida y disponibilidad de habitaciones.",
    customer_heading_title: "Su Experiencia como Huésped",
    customer_heading_intro: "Bienvenido a MOM'S KID HOTEL. Vea sus reservaciones, explore suites disponibles y reserve su próxima estancia.",

    tab_overview: "Resumen",
    tab_rooms: "Habitaciones y Suites",
    tab_bookings: "Reservaciones",
    tab_users: "Cuentas activas",
    tab_deleted_users: "Cuentas archivadas",
    tab_audit: "Seguridad y Auditoría",
    tab_backups: "Copias de seguridad",
    tab_catalog: "Explorar y Reservar",
    tab_profile: "Cuenta y Seguridad",
    tab_frontdesk: "Recepción y Registro",
    tab_customers: "Directorio de clientes",
    tab_team: "Miembros del equipo",
    tab_my_stays: "Mis Estancias y Reservaciones",

    metric_total_rooms: "Total Habitaciones",
    metric_occupied_rooms: "Habitaciones ocupadas",
    metric_confirmed_stays: "Estancias confirmadas",
    metric_in_house: "Huéspedes alojados",
    metric_active_users: "Usuarios activos",
    metric_archived_users: "Usuarios archivados",
    metric_upcoming_stays: "Próximas estancias",
    metric_staff_members: "Miembros del equipo",
    metric_pending_checkins: "Entradas pendientes",
    metric_rooms_cleaning: "Habitaciones en limpieza",
    metric_2fa_status: "Seguridad 2FA",
    metric_active: "Activo",

    sec_quick_ops: "Operaciones rápidas",
    sec_recent_reservations: "Reservaciones recientes",
    sec_room_directory: "Directorio y Disponibilidad de Habitaciones",
    sec_all_reservations: "Todas las reservaciones",
    sec_active_accounts: "Directorio de cuentas activas",
    sec_create_account: "Crear una nueva cuenta",
    sec_deleted_archive: "Archivo de cuentas eliminadas (Auditoría permanente)",
    sec_audit_log: "Registro de auditoría y seguridad",
    sec_encrypted_backups: "Copias de seguridad cifradas",
    sec_todays_arrivals: "Llegadas de hoy y recepción",
    sec_room_inventory: "Inventario de habitaciones y estado de limpieza",
    sec_guest_reservations: "Reservaciones de huéspedes",
    sec_team_directory: "Directorio del equipo",
    sec_add_staff: "Agregar cuenta de personal o huésped",
    sec_operational_audit: "Actividad de auditoría operativa",
    sec_quick_queue: "Cola rápida de entrada y salida",
    sec_live_availability: "Disponibilidad en vivo",
    sec_reservations_directory: "Directorio de reservaciones",
    sec_customer_directory: "Huéspedes registrados",
    sec_your_reservations: "Sus reservaciones",
    sec_available_rooms: "Habitaciones y Suites disponibles",
    sec_account_credentials: "Credenciales y Acceso a la cuenta",

    quick_view_reservations: "Ver todas las reservaciones",
    quick_manage_rooms: "Gestionar habitaciones",
    quick_create_account: "Crear nueva cuenta",
    quick_view_archive: "Ver cuentas archivadas",
    btn_explore_rooms: "Explorar habitaciones y reservar",

    search_accounts_placeholder: "Filtrar cuentas por correo o rol…",
    hint_active_users: "usuarios activos en total",
    empty_accounts: "No se encontraron cuentas.",
    th_id: "ID",
    th_email: "Correo",
    th_role: "Rol / Acceso",
    th_created: "Creado",
    th_actions: "Acciones",
    hint_protected_admin: "Admin protegido",
    btn_archive_delete: "Archivar y eliminar",
    btn_save: "Guardar",

    search_deleted_placeholder: "Buscar cuentas archivadas…",
    hint_archived_accounts: "cuentas archivadas",
    empty_deleted_archive: "No hay cuentas en el archivo. Cuando un administrador elimina un usuario, el historial se preserva aquí.",
    th_archive_num: "Archivo N°",
    th_orig_id: "ID Original",
    th_orig_role: "Rol Original",
    th_deleted_at: "Eliminado el",
    th_deleted_by: "Eliminado por",
    th_reason: "Motivo",

    search_rooms_placeholder: "Buscar habitación por número, tipo, comodidades…",
    btn_add_room: "+ Agregar habitación",
    th_room_num: "Habitación N°",
    th_room_type: "Tipo",
    th_price_night: "Precio / Noche",
    th_capacity: "Capacidad",
    th_amenities: "Comodidades",
    th_status: "Estado",
    btn_change_status: "Cambiar estado",
    btn_delete: "Eliminar",

    search_bookings_placeholder: "Buscar por referencia, huésped o habitación…",
    hint_reservations: "reservaciones",
    empty_bookings: "No hay reservaciones registradas aún.",
    th_booking_ref: "Referencia",
    th_guest_contact: "Nombre y Contacto",
    th_room: "Habitación",
    th_dates: "Fechas",
    th_total_price: "Precio total",
    btn_checkin: "Registrar entrada",
    btn_checkout: "Registrar salida",
    btn_cancel: "Cancelar",
    btn_reserve_room: "Reservar habitación",
    price_per_night: "/ noche",
    guests_suffix: "huéspedes",

    search_audit_placeholder: "Buscar en registro de seguridad…",
    empty_audit: "No hay actividad registrada aún.",
    th_audit_action: "Acción",
    th_audit_actor_subject: "Autor y Asunto",
    th_audit_datetime: "Fecha y Hora",

    field_temp_password: "Contraseña temporal",
    field_entity: "Entidad",
    hint_temp_password: "Al menos 12 caracteres. La cuenta deberá verificar su correo en el primer inicio de sesión.",
    btn_create_account_submit: "Crear cuenta",

    btn_trigger_backup: "Crear copia de seguridad ahora",
    backup_desc_auto: "Las copias de seguridad locales cifradas se ejecutan automáticamente cada 24 horas.",
    backup_cloud_enabled: "La copia en la nube AWS S3 está habilitada.",
    backup_cloud_disabled: "Copias locales cifradas activas. Para habilitar copias en la nube, configure AWS S3.",

    modal_book_title: "Reservar Habitación {number}",
    modal_book_name: "Nombre completo del huésped",
    modal_book_email: "Correo del huésped",
    modal_book_phone: "Teléfono (opcional)",
    modal_book_checkin: "Fecha de llegada",
    modal_book_checkout: "Fecha de salida",
    modal_book_guests: "Número de huéspedes",
    modal_book_requests: "Peticiones especiales (opcional)",
    modal_book_submit: "Confirmar y Reservar",

    modal_add_room_title: "Agregar nueva habitación",
    modal_room_num: "Número de habitación",
    modal_room_type: "Tipo / Nombre de habitación",
    modal_price_night: "Precio / Noche ($)",
    modal_capacity: "Capacidad máxima",
    modal_amenities: "Comodidades",
    modal_initial_status: "Estado inicial",
    modal_desc: "Descripción",
    modal_create_room_submit: "Crear habitación",

    modal_edit_status_title: "Actualizar estado de la Habitación {number}",
    modal_select_new_status: "Seleccionar nuevo estado",
    modal_update_status_submit: "Actualizar estado",

    modal_delete_user_title: "Archivar y eliminar cuenta",
    modal_delete_user_prompt: "¿Está seguro de que desea eliminar definitivamente la cuenta {role} de {email}?",
    modal_delete_archive_guarantee: "Garantía de archivo permanente:",
    modal_delete_archive_info: "Esta cuenta será desactivada, todas las sesiones se invalidarán de inmediato y se registrará un registro permanente en el Archivo de cuentas eliminadas.",
    modal_delete_reason: "Motivo de la eliminación",
    modal_delete_submit: "Archivar y eliminar definitivamente",
    modal_cancel: "Cancelar",

    status_available: "Disponible",
    status_occupied: "Ocupada",
    status_cleaning: "Limpieza",
    status_maintenance: "Mantenimiento",
    status_confirmed: "confirmada",
    status_checked_in: "alojado",
    status_checked_out: "finalizada",
    status_cancelled: "cancelada",

    label_registered_email: "Correo registrado",
    msg_passwords_mismatch: "Las contraseñas no coinciden.",
    toast_lang_set: "Idioma establecido en {lang}",
    toast_time_set: "Formato de hora establecido en {format}",
    toast_prefs_restored: "Preferencias del sistema restauradas.",
  },

  de: {
    hero_guest_eyebrow: "DAS MOM'S KID HOTEL ERLEBNIS",
    hero_guest_title: "Willkommen in Ihrem zweiten Zuhause.",
    hero_guest_caption: "Herzliche Gastfreundschaft, liebevolle Details und ein unvergesslicher Aufenthalt.",
    hero_admin_eyebrow: "DIE GENERALDIREKTIONS-SUITE",
    hero_admin_title: "Das gesamte Hotel im Blick.",
    hero_admin_caption: "Ein klares Kontrollzentrum für Personal, Leistung, Sicherheit und herausragende Aufenthalte.",
    hero_manager_eyebrow: "DIE BETRIEBSLOUNGE",
    hero_manager_title: "Ein gelungener Aufenthalt beginnt hier.",
    hero_manager_caption: "Bringen Sie das Team zusammen und führen Sie den Gästebetrieb mit Umsicht und Präzision.",
    hero_staff_eyebrow: "DER GÄSTESERVICE-DESK",
    hero_staff_title: "Jede Aufmerksamkeit zählt.",
    hero_staff_caption: "Ihr Arbeitsplatz hält das Gästeverzeichnis stets griffbereit für perfekten Service.",
    hero_customer_eyebrow: "IHR PRIVATES GÄSTEPORTAL",
    hero_customer_title: "Ihr Aufenthalt, ganz persönlich.",
    hero_customer_caption: "Ein einladender Bereich für Ihre Buchungen, damit Sie sich sofort wie zu Hause fühlen.",

    pref_restore: "Standardwerte wiederherstellen",
    pref_restore_title: "Systemeinstellungen (Farbschema, Modus, Zeitformat, Sprache) zurücksetzen, ohne Daten zu ändern",
    pref_restore_confirm: "Systemeinstellungen (Anzeigemodus, Sprache, Zeitformat) auf Standardwerte zurücksetzen?\n\n(Hinweis: Alle Benutzerkonten, Zimmer und Buchungsdaten bleiben vollständig erhalten.)",
    mode_auto: "Automatischer Modus",
    mode_light: "Heller Modus",
    mode_dark: "Dunkler Modus",
    time_12h: "12-Stunden",
    time_24h: "24-Stunden",

    role_guest: "Gast",
    role_staff: "Personal",
    role_manager: "Manager",
    role_admin: "Admin",
    role_title_admin: "Hotel-Administrator",
    role_title_manager: "Betriebsleiter",
    role_title_staff: "Gästeservice-Personal",
    role_title_customer: "Geschätzter Hotelgast",

    login_eyebrow: "Gäste- & Teamzugang",
    login_title: "Willkommen zurück.",
    login_intro: "Melden Sie sich im MOM'S KID HOTEL an. Wählen Sie Ihren Kontotyp und geben Sie Ihre Anmeldedaten ein.",
    login_2fa_badge: "Zwei-Faktor-Authentifizierung (2FA) zum Schutz Ihres Kontos aktiv.",
    login_demo_title: "Sofort-2FA-Demomodus aktiv",
    login_demo_desc: "Live-E-Mail-Zustellung ist nicht konfiguriert. Ihr 6-stelliger Bestätigungscode wird direkt auf dem Bildschirm angezeigt.",
    field_account_type: "Kontotyp",
    field_email: "E-Mail-Adresse",
    field_password: "Passwort",
    btn_show: "Anzeigen",
    btn_hide: "Ausblenden",
    remember_device: "Dieses Gerät merken",
    forgot_password: "Passwort vergessen?",
    btn_signin: "Im Portal anmelden",
    new_guest_prompt: "Neu im MOM'S KID HOTEL?",
    btn_create_account: "Gästekonto erstellen",

    forgot_eyebrow: "Kontowiederherstellung",
    forgot_title: "Passwort zurücksetzen.",
    forgot_intro: "Geben Sie die für Ihr Konto registrierte E-Mail-Adresse ein. Wir senden Ihnen einen 10 Minuten gültigen Code.",
    btn_send_reset: "Code senden",
    btn_back_login: "Zurück zur Anmeldung",

    reset_eyebrow: "Sicheres Zurücksetzen",
    reset_title: "Neues Passwort erstellen.",
    reset_intro: "Geben Sie den 6-stelligen Code ein und wählen Sie ein neues Passwort mit mindestens 12 Zeichen.",
    reset_demo_title: "Sofort-Code (Demomodus)",
    btn_autofill: "⚡ Code automatisch einfügen",
    field_reset_code: "Bestätigungscode",
    field_new_password: "Neues Passwort",
    field_confirm_password: "Passwort bestätigen",
    placeholder_min12: "Mindestens 12 Zeichen",
    placeholder_reenter: "Passwort erneut eingeben",
    btn_update_password: "Passwort aktualisieren",

    register_eyebrow: "Gästeregistrierung",
    register_title: "Konto erstellen.",
    register_intro: "Werden Sie Gast im MOM'S KID HOTEL. Genießen Sie einfache Zimmerbuchungen und Übersicht.",
    field_create_password: "Passwort festlegen",
    btn_register_submit: "Gästekonto erstellen",

    otp_eyebrow: "Zwei-Faktor-Authentifizierung",
    otp_title: "Bestätigen Sie Ihre Identität.",
    otp_intro: "Ein 6-stelliger Sicherheitscode wurde an {dest} gesendet. Bitte prüfen Sie Ihren Posteingang (auch den Spam-Ordner) und geben Sie ihn unten ein.",
    otp_demo_title: "Sofort-2FA-Code (Demomodus)",
    field_otp_code: "6-stelligen Code eingeben",
    btn_verify_enter: "Bestätigen & Anmelden",
    btn_resend_code: "Bestätigungscode erneut senden",
    otp_hint_title: "Code nicht erhalten?",
    otp_hint_spam: "Bitte überprüfen Sie Ihren Spam- oder Junk-Ordner.",
    otp_hint_terminal: "In der lokalen Entwicklung wird der 6-stellige Code auch direkt im Server-Terminal ausgegeben.",

    btn_logout: "Abmelden",
    admin_heading_title: "Generaldirektions-Suite",
    admin_heading_intro: "Vollständiger Überblick über Hotelbetrieb, Zimmerbestand, Reservierungen, Benutzerkonten und Systemsicherheit.",
    manager_heading_title: "Betriebslounge",
    manager_heading_intro: "Koordinieren Sie das Tagesgeschäft, den Gästeservice, den Zimmerbestand und Ihr Team.",
    staff_heading_title: "Gästeservice & Rezeption",
    staff_heading_intro: "Gästebetreuung vor Ort, schneller Check-in / Check-out und aktuelle Zimmerverfügbarkeit.",
    customer_heading_title: "Ihr Gästeerlebnis",
    customer_heading_intro: "Willkommen im MOM'S KID HOTEL. Sehen Sie Ihre Buchungen ein, entdecken Sie verfügbare Suiten und buchen Sie Ihren Aufenthalt.",

    tab_overview: "Übersicht",
    tab_rooms: "Zimmer & Suiten",
    tab_bookings: "Buchungen",
    tab_users: "Aktive Konten",
    tab_deleted_users: "Archivierte Konten",
    tab_audit: "Sicherheit & Audit",
    tab_backups: "Verschlüsselte Backups",
    tab_catalog: "Zimmer ansehen & buchen",
    tab_profile: "Konto & Sicherheit",
    tab_frontdesk: "Rezeption & Check-in",
    tab_customers: "Gästeverzeichnis",
    tab_team: "Teammitglieder",
    tab_my_stays: "Meine Aufenthalte & Buchungen",

    metric_total_rooms: "Zimmer gesamt",
    metric_occupied_rooms: "Belegte Zimmer",
    metric_confirmed_stays: "Bestätigte Aufenthalte",
    metric_in_house: "Gäste im Haus",
    metric_active_users: "Aktive Benutzer",
    metric_archived_users: "Archivierte Benutzer",
    metric_upcoming_stays: "Bevorstehende Aufenthalte",
    metric_staff_members: "Teammitglieder",
    metric_pending_checkins: "Ausstehende Check-ins",
    metric_rooms_cleaning: "Zimmer in Reinigung",
    metric_2fa_status: "2FA-Sicherheit",
    metric_active: "Aktiv",

    sec_quick_ops: "Schnellaktionen",
    sec_recent_reservations: "Aktuelle Reservierungen",
    sec_room_directory: "Zimmerverzeichnis & Verfügbarkeit",
    sec_all_reservations: "Alle Gästereservierungen",
    sec_active_accounts: "Verzeichnis aktiver Konten",
    sec_create_account: "Neues Mitarbeiter-, Manager- oder Gästekonto anlegen",
    sec_deleted_archive: "Archiv gelöschter Konten (Dauerhafter Revisionsnachweis)",
    sec_audit_log: "Audit-Protokoll & Sicherheitsaktivitäten",
    sec_encrypted_backups: "Verschlüsselte Datenbanksicherungen",
    sec_todays_arrivals: "Heutige Anreisen & Rezeption",
    sec_room_inventory: "Zimmerbestand & Reinigungsstatus",
    sec_guest_reservations: "Gästereservierungen",
    sec_team_directory: "Teamverzeichnis",
    sec_add_staff: "Mitarbeiter- oder Gästekonto hinzufügen",
    sec_operational_audit: "Betriebliche Audit-Aktivitäten",
    sec_quick_queue: "Schnell-Check-in & Abreisen",
    sec_live_availability: "Live-Zimmerverfügbarkeit",
    sec_reservations_directory: "Reservierungsverzeichnis",
    sec_customer_directory: "Registrierte Gäste",
    sec_your_reservations: "Ihre Reservierungen",
    sec_available_rooms: "Verfügbare Zimmer & Suiten",
    sec_account_credentials: "Zugangsdaten & Kontosicherheit",

    quick_view_reservations: "Alle Reservierungen anzeigen",
    quick_manage_rooms: "Zimmerbestand verwalten",
    quick_create_account: "Neues Konto anlegen",
    quick_view_archive: "Archivierte Konten anzeigen",
    btn_explore_rooms: "Zimmer ansehen & buchen",

    search_accounts_placeholder: "Konten nach E-Mail oder Rolle filtern…",
    hint_active_users: "aktive Benutzer insgesamt",
    empty_accounts: "Keine Konten gefunden.",
    th_id: "ID",
    th_email: "E-Mail",
    th_role: "Rolle / Zugang",
    th_created: "Erstellt am",
    th_actions: "Aktionen",
    hint_protected_admin: "Geschützter Admin",
    btn_archive_delete: "Archivieren & Löschen",
    btn_save: "Speichern",

    search_deleted_placeholder: "Archivierte Konten durchsuchen…",
    hint_archived_accounts: "archivierte Konten",
    empty_deleted_archive: "Keine Konten im Archiv. Wenn ein Administrator ein Konto löscht, wird der Verlauf hier aufbewahrt.",
    th_archive_num: "Archiv-Nr.",
    th_orig_id: "Ursprüngliche ID",
    th_orig_role: "Ursprüngliche Rolle",
    th_deleted_at: "Gelöscht am",
    th_deleted_by: "Gelöscht von",
    th_reason: "Grund",

    search_rooms_placeholder: "Zimmer nach Nummer, Typ, Ausstattung durchsuchen…",
    btn_add_room: "+ Neues Zimmer hinzufügen",
    th_room_num: "Zimmer-Nr.",
    th_room_type: "Typ",
    th_price_night: "Preis / Nacht",
    th_capacity: "Kapazität",
    th_amenities: "Ausstattung",
    th_status: "Status",
    btn_change_status: "Status ändern",
    btn_delete: "Löschen",

    search_bookings_placeholder: "Nach Referenz, Gast oder Zimmer suchen…",
    hint_reservations: "Reservierungen",
    empty_bookings: "Noch keine Reservierungen erfasst.",
    th_booking_ref: "Referenz",
    th_guest_contact: "Gast & Kontakt",
    th_room: "Zimmer",
    th_dates: "Reisedaten",
    th_total_price: "Gesamtpreis",
    btn_checkin: "Einchecken",
    btn_checkout: "Auschecken",
    btn_cancel: "Stornieren",
    btn_reserve_room: "Zimmer reservieren",
    price_per_night: "/ Nacht",
    guests_suffix: "Gäste",

    search_audit_placeholder: "Sicherheitsprotokoll durchsuchen…",
    empty_audit: "Noch keine Aktivitäten protokolliert.",
    th_audit_action: "Aktion",
    th_audit_actor_subject: "Akteur & Betreff",
    th_audit_datetime: "Datum & Uhrzeit",

    field_temp_password: "Vorläufiges Passwort",
    field_entity: "Entität",
    hint_temp_password: "Mindestens 12 Zeichen. Das Konto muss die E-Mail beim ersten Login verifizieren.",
    btn_create_account_submit: "Konto erstellen",

    btn_trigger_backup: "Verschlüsseltes Backup jetzt erstellen",
    backup_desc_auto: "Verschlüsselte lokale Momentaufnahmen laufen automatisch alle 24 Stunden.",
    backup_cloud_enabled: "Online-AWS-S3-Sicherung ist aktiviert.",
    backup_cloud_disabled: "Lokale Sicherung aktiv. Um Cloud-Kopien zu aktivieren, konfigurieren Sie AWS S3.",

    modal_book_title: "Zimmer {number} buchen",
    modal_book_name: "Vollständiger Name des Gastes",
    modal_book_email: "E-Mail-Adresse des Gastes",
    modal_book_phone: "Telefonnummer (optional)",
    modal_book_checkin: "Anreisedatum",
    modal_book_checkout: "Abreisedatum",
    modal_book_guests: "Anzahl Gäste",
    modal_book_requests: "Besondere Wünsche (optional)",
    modal_book_submit: "Buchung bestätigen & reservieren",

    modal_add_room_title: "Neues Zimmer hinzufügen",
    modal_room_num: "Zimmernummer",
    modal_room_type: "Zimmertyp / Bezeichnung",
    modal_price_night: "Preis / Nacht ($)",
    modal_capacity: "Maximale Kapazität",
    modal_amenities: "Ausstattung",
    modal_initial_status: "Anfangsstatus",
    modal_desc: "Beschreibung",
    modal_create_room_submit: "Zimmer anlegen",

    modal_edit_status_title: "Status für Zimmer {number} aktualisieren",
    modal_select_new_status: "Neuen Zimmerstatus wählen",
    modal_update_status_submit: "Zimmerstatus aktualisieren",

    modal_delete_user_title: "Konto archivieren & löschen",
    modal_delete_user_prompt: "Möchten Sie das {role}-Konto für {email} wirklich unwiderruflich löschen?",
    modal_delete_archive_guarantee: "Garantie dauerhafter Archivierung:",
    modal_delete_archive_info: "Dieses Konto wird sofort deaktiviert, alle aktiven Sitzungen werden ungültig und ein dauerhafter Datensatz im Archiv gelöschter Konten gespeichert.",
    modal_delete_reason: "Grund für die Kontolöschung",
    modal_delete_submit: "Dauerhaft archivieren & löschen",
    modal_cancel: "Abbrechen",

    status_available: "Verfügbar",
    status_occupied: "Belegt",
    status_cleaning: "Reinigung",
    status_maintenance: "Wartung",
    status_confirmed: "bestätigt",
    status_checked_in: "eingecheckt",
    status_checked_out: "ausgecheckt",
    status_cancelled: "storniert",

    label_registered_email: "Registrierte E-Mail",
    msg_passwords_mismatch: "Die Passwörter stimmen nicht überein.",
    toast_lang_set: "Sprache auf {lang} eingestellt",
    toast_time_set: "Zeitformat auf {format} eingestellt",
    toast_prefs_restored: "Systemeinstellungen auf Standard zurückgesetzt.",
  },

  zh: {
    hero_guest_eyebrow: "MOM'S KID 酒店尊享体验",
    hero_guest_title: "欢迎回到温馨的家外之家。",
    hero_guest_caption: "热忱的款待、体贴的细节，让每一次下榻都值得回味。",
    hero_admin_eyebrow: "总经理管理套件",
    hero_admin_title: "全盘掌握酒店运营。",
    hero_admin_caption: "集人员、业绩、安全和卓越品质于一体的综合指挥中心。",
    hero_manager_eyebrow: "运营管理中心",
    hero_manager_title: "精彩入住从这里开启。",
    hero_manager_caption: "凝聚团队力量，细心高效保障宾客日常运营。",
    hero_staff_eyebrow: "宾客服务前台",
    hero_staff_title: "用心关注每一个细节。",
    hero_staff_caption: "随时查阅宾客信息，将热情周到的服务放在首位。",
    hero_customer_eyebrow: "贵宾专属门户",
    hero_customer_title: "专属定制您的舒适旅程。",
    hero_customer_caption: "在您抵达之前，即可随时查看预订详情并享受宾至如归的体验。",
    pref_restore: "恢复默认设置",
    pref_restore_title: "恢复系统首选项（主题、显示模式、时间格式、语言）而不改变任何业务数据",
    pref_restore_confirm: "确定要将系统首选项（显示模式、语言、时间格式）恢复为出厂默认设置吗？\n\n（注意：所有用户账户、客房和预订记录将完好无损。）",
    mode_auto: "自动模式",
    mode_light: "浅色模式",
    mode_dark: "深色模式",
    time_12h: "12小时制",
    time_24h: "24小时制",
    role_guest: "宾客",
    role_staff: "员工",
    role_manager: "经理",
    role_admin: "管理员",
    role_title_admin: "酒店总管/管理员",
    role_title_manager: "酒店运营经理",
    role_title_staff: "宾客服务员工",
    role_title_customer: "尊贵酒店宾客",
    login_eyebrow: "宾客与团队入口",
    login_title: "欢迎回来。",
    login_intro: "登录 MOM'S KID HOTEL 门户。请选择账户类型并输入您的凭据。",
    login_2fa_badge: "双重身份验证 (2FA) 已开启，保障账户安全。",
    login_demo_title: "演示模式即时 2FA 代码生效",
    login_demo_desc: "邮件发送服务未配置。6位验证码将直接在屏幕上显示以供快捷登录。",
    field_account_type: "账户类型",
    field_email: "电子邮箱",
    field_password: "密码",
    btn_show: "显示",
    btn_hide: "隐藏",
    remember_device: "记住这台设备",
    forgot_password: "忘记密码？",
    btn_signin: "登录门户",
    new_guest_prompt: "首次光临 MOM'S KID HOTEL？",
    btn_create_account: "注册宾客账户",
    forgot_eyebrow: "账户找回",
    forgot_title: "重置您的密码。",
    forgot_intro: "输入您注册时使用的电子邮箱。我们将发送一个10分钟内有效的密码重置验证码。",
    btn_send_reset: "发送重置验证码",
    btn_back_login: "返回登录",
    reset_eyebrow: "安全重置密码",
    reset_title: "创建新密码。",
    reset_intro: "请输入6位数重置验证码，并设置至少12位字符的新密码。",
    reset_demo_title: "即时重置验证码（演示模式）",
    btn_autofill: "⚡ 自动填充验证码",
    field_reset_code: "重置验证码",
    field_new_password: "新密码",
    field_confirm_password: "确认新密码",
    placeholder_min12: "至少 12 个字符",
    placeholder_reenter: "再次输入新密码",
    btn_update_password: "更新密码",
    register_eyebrow: "宾客注册",
    register_title: "创建您的账户。",
    register_intro: "加入 MOM'S KID HOTEL 尊贵宾客会员。轻松预订客房、备注特殊要求并跟踪订单。",
    field_create_password: "设置密码",
    btn_register_submit: "创建宾客账户",
    otp_eyebrow: "双重身份验证",
    otp_title: "验证您的身份。",
    otp_intro: "已向 {dest} 发送6位安全验证码。请查看您的邮箱（包括垃圾邮件箱）并在下方输入以进入系统。",
    otp_demo_title: "即时 2FA 验证码（演示模式）",
    field_otp_code: "输入 6 位验证码",
    btn_verify_enter: "验证并进入系统",
    btn_resend_code: "重新发送验证码",
    otp_hint_title: "未收到验证码？",
    otp_hint_spam: "请检查您的垃圾邮件 (Spam) 或广告邮件文件夹。",
    otp_hint_terminal: "在本地开发环境中，6位验证码也会直接打印在服务器终端控制台中。",
    btn_logout: "退出登录",
    admin_heading_title: "总经理套件控制中心",
    admin_heading_intro: "全方位掌控酒店运营、房态房量、预订订单、账户管理以及系统安全完整性。",
    manager_heading_title: "运营管理中心",
    manager_heading_intro: "统筹日常酒店运营、宾客服务接待、客房状态与团队协作活动。",
    staff_heading_title: "宾客服务与前台接待",
    staff_heading_intro: "前台接待一线、快速办理入住与退房、客房可用状态看板。",
    customer_heading_title: "您的专属入住体验",
    customer_heading_intro: "欢迎来到 MOM'S KID HOTEL。查看您的预订记录、浏览套房并规划下一次旅程。",
    tab_overview: "概览",
    tab_rooms: "客房与套房",
    tab_bookings: "预订管理",
    tab_users: "活跃账户",
    tab_deleted_users: "归档账户",
    tab_audit: "安全审计",
    tab_backups: "加密备份",
    tab_catalog: "浏览与预订客房",
    tab_profile: "账户与安全",
    tab_frontdesk: "前台入住接待",
    tab_customers: "客户名录",
    tab_team: "团队成员",
    tab_my_stays: "我的预订与行程",
    metric_total_rooms: "客房总数",
    metric_occupied_rooms: "已入住客房",
    metric_confirmed_stays: "已确认预订",
    metric_in_house: "在店宾客",
    metric_active_users: "活跃用户数",
    metric_archived_users: "已归档用户",
    metric_upcoming_stays: "即将入住",
    metric_staff_members: "在职员工数",
    metric_pending_checkins: "待办理入住",
    metric_rooms_cleaning: "清洁中客房",
    metric_2fa_status: "2FA 安全防护",
    metric_active: "已开启",
    sec_quick_ops: "快捷操作",
    sec_recent_reservations: "近期预订记录",
    sec_room_directory: "客房目录与可用状态",
    sec_all_reservations: "全部宾客预订",
    sec_active_accounts: "活跃账户名录",
    sec_create_account: "创建新员工、经理或客户账户",
    sec_deleted_archive: "已删除账户归档（永久历史审计记录）",
    sec_audit_log: "审计日志与安全事件",
    sec_encrypted_backups: "加密数据库备份",
    sec_todays_arrivals: "今日抵店与前台接待",
    sec_room_inventory: "客房清单与卫生清洁状态",
    sec_guest_reservations: "宾客预订管理",
    sec_team_directory: "团队成员名录",
    sec_add_staff: "添加员工或客户账户",
    sec_operational_audit: "运营审计活动记录",
    sec_quick_queue: "快速入住与退房队列",
    sec_live_availability: "实时客房空房状态",
    sec_reservations_directory: "预订订单名录",
    sec_customer_directory: "注册会员宾客",
    sec_your_reservations: "您的客房预订",
    sec_available_rooms: "可预订客房与套房",
    sec_account_credentials: "账户凭证与权限",
    quick_view_reservations: "查看全部预订",
    quick_manage_rooms: "管理客房库存",
    quick_create_account: "配置新账户",
    quick_view_archive: "查看已归档删除账户",
    btn_explore_rooms: "探索客房并预订入住",
    search_accounts_placeholder: "按邮箱或角色筛选账户…",
    hint_active_users: "位活跃用户",
    empty_accounts: "未找到账户。",
    th_id: "ID",
    th_email: "电子邮箱",
    th_role: "角色 / 权限",
    th_created: "创建时间",
    th_actions: "操作",
    hint_protected_admin: "受保护的管理员",
    btn_archive_delete: "归档并删除",
    btn_save: "保存",
    search_deleted_placeholder: "搜索已删除账户…",
    hint_archived_accounts: "个归档账户",
    empty_deleted_archive: "归档库中暂无已删除账户。管理员删除用户后，历史审计记录将永久保留在此处。",
    th_archive_num: "归档编号",
    th_orig_id: "原始 ID",
    th_orig_role: "原始角色",
    th_deleted_at: "删除时间",
    th_deleted_by: "操作管理员",
    th_reason: "删除原因",
    search_rooms_placeholder: "按房号、房型、配套设施搜索客房…",
    btn_add_room: "+ 添加新客房",
    th_room_num: "房号",
    th_room_type: "房型名称",
    th_price_night: "价格 / 每晚",
    th_capacity: "容纳人数",
    th_amenities: "配套设施",
    th_status: "当前状态",
    btn_change_status: "修改状态",
    btn_delete: "删除",
    search_bookings_placeholder: "按预订参考号、客人姓名或房号搜索…",
    hint_reservations: "条预订记录",
    empty_bookings: "暂无预订记录。",
    th_booking_ref: "预订参考号",
    th_guest_contact: "客人姓名与联系方式",
    th_room: "客房",
    th_dates: "入住日期",
    th_total_price: "总金额",
    btn_checkin: "办理入住",
    btn_checkout: "办理退房",
    btn_cancel: "取消预订",
    btn_reserve_room: "立即预订",
    price_per_night: "/ 每晚",
    guests_suffix: "位宾客",
    search_audit_placeholder: "搜索安全审计日志…",
    empty_audit: "暂无活动记录。",
    th_audit_action: "事件动作",
    th_audit_actor_subject: "操作人与对象",
    th_audit_datetime: "日期与时间",
    field_temp_password: "初始临时密码",
    field_entity: "账户权限角色",
    hint_temp_password: "至少 12 个字符。首次登录时需完成邮箱验证。",
    btn_create_account_submit: "确认创建账户",
    btn_trigger_backup: "立即生成加密备份",
    backup_desc_auto: "系统每 24 小时自动生成加密本地快照。",
    backup_cloud_enabled: "已启用在线 AWS S3 异地容灾备份副本。",
    backup_cloud_disabled: "本地加密备份已激活。如需开启云端异地备份，请配置 AWS S3 环境变量。",
    modal_book_title: "预订 {number} 号客房",
    modal_book_name: "宾客姓名",
    modal_book_email: "宾客电子邮箱",
    modal_book_phone: "联系电话（选填）",
    modal_book_checkin: "入住日期",
    modal_book_checkout: "退房日期",
    modal_book_guests: "入住人数",
    modal_book_requests: "特殊要求（选填）",
    modal_book_submit: "确认并提交预订",
    modal_add_room_title: "添加新客房",
    modal_room_num: "客房房号",
    modal_room_type: "客房类型 / 名称",
    modal_price_night: "每晚价格 ($)",
    modal_capacity: "最大容纳人数",
    modal_amenities: "客房配套设施",
    modal_initial_status: "初始状态",
    modal_desc: "客房描述",
    modal_create_room_submit: "创建客房",
    modal_edit_status_title: "更新 {number} 号房状态",
    modal_select_new_status: "选择新客房状态",
    modal_update_status_submit: "更新客房状态",
    modal_delete_user_title: "归档并注销账户",
    modal_delete_user_prompt: "您确定要永久注销 {email} 的 {role} 账户吗？",
    modal_delete_archive_guarantee: "永久归档保障：",
    modal_delete_archive_info: "该账户将被解除一切活跃权限，其所有活跃会话与待验证码将立即失效，且完整的审计记录（含操作管理员与时间戳）将永久存储在已删除账户归档中。",
    modal_delete_reason: "删除/注销原因",
    modal_delete_submit: "永久归档并注销",
    modal_cancel: "取消",
    status_available: "空闲可用",
    status_occupied: "已入住",
    status_cleaning: "清洁整理中",
    status_maintenance: "维修保养中",
    status_confirmed: "已确认",
    status_checked_in: "已入住",
    status_checked_out: "已退房",
    status_cancelled: "已取消",
    label_registered_email: "注册电子邮箱",
    msg_passwords_mismatch: "两次输入的密码不一致。",
    toast_lang_set: "语言已设置为 {lang}",
    toast_time_set: "时间格式已切换为 {format}",
    toast_prefs_restored: "系统首选项已恢复为出厂默认设置。",
  },

  ja: {
    hero_guest_eyebrow: "MOM'S KID HOTEL エクスペリエンス",
    hero_guest_title: "第二の我が家へようこそ。",
    hero_guest_caption: "心温まるおもてなしと細やかな気配りで、思い出に残る特別なご滞在を。",
    hero_admin_eyebrow: "総支配人スイート",
    hero_admin_title: "ホテル運営のすべてを一望。",
    hero_admin_caption: "スタッフ、業績、セキュリティ、そして上質なおもてなしを支える統合司令センター。",
    hero_manager_eyebrow: "オペレーションラウンジ",
    hero_manager_title: "最高のご滞在はここから始まります。",
    hero_manager_caption: "チーム一丸となり、信頼と真心をもって毎日のホテル運営を推進します。",
    hero_staff_eyebrow: "ゲストサービスデスク",
    hero_staff_title: "細やかな心遣いを大切に。",
    hero_staff_caption: "お客様の情報を迅速に確認し、常に最高のおもてなしをお届けします。",
    hero_customer_eyebrow: "お客様専用ポータル",
    hero_customer_title: "あなただけの上質なご滞在を。",
    hero_customer_caption: "ご到着前からご予約内容の確認や各種リクエストをスムーズに行えます。",
    pref_restore: "初期設定に戻す",
    pref_restore_title: "データを保持したまま、システム環境設定（テーマ、表示モード、時間形式、言語）を出荷時状態にリセットします",
    pref_restore_confirm: "システム環境設定（表示モード、言語、時刻形式）を初期設定に戻しますか？\n\n（※ユーザーアカウント、客室、予約データには一切影響しません。）",
    mode_auto: "自動モード",
    mode_light: "ライトモード",
    mode_dark: "ダークモード",
    time_12h: "12時間表示",
    time_24h: "24時間表示",
    role_guest: "ゲスト",
    role_staff: "スタッフ",
    role_manager: "マネージャー",
    role_admin: "管理者",
    role_title_admin: "ホテル総支配人/管理者",
    role_title_manager: "運営マネージャー",
    role_title_staff: "ゲストサービススタッフ",
    role_title_customer: "大切なご宿泊ゲスト",
    login_eyebrow: "ゲスト＆スタッフアクセス",
    login_title: "お帰りなさいませ。",
    login_intro: "MOM'S KID HOTEL ポータルにサインインします。アカウント種別を選択し、認証情報を入力してください。",
    login_2fa_badge: "アカウント保護のため二要素認証 (2FA) が有効です。",
    login_demo_title: "デモモード：即時2FAコード有効",
    login_demo_desc: "メール送信サービスが未設定です。画面上に直接6桁の認証コードが表示されます。",
    field_account_type: "アカウント種別",
    field_email: "メールアドレス",
    field_password: "パスワード",
    btn_show: "表示",
    btn_hide: "非表示",
    remember_device: "この端末を記憶する",
    forgot_password: "パスワードをお忘れですか？",
    btn_signin: "ポータルにサインイン",
    new_guest_prompt: "初めてのご利用ですか？",
    btn_create_account: "ゲストアカウント作成",
    forgot_eyebrow: "アカウント復旧",
    forgot_title: "パスワードの再設定。",
    forgot_intro: "ご登録のメールアドレスを入力してください。10分間有効な再設定コードをお送りします。",
    btn_send_reset: "再設定コードを送信",
    btn_back_login: "サインインに戻る",
    reset_eyebrow: "安全なパスワード再設定",
    reset_title: "新しいパスワードの作成。",
    reset_intro: "6桁の再設定コードを入力し、12文字以上の新しいパスワードを設定してください。",
    reset_demo_title: "即時再設定コード（デモモード）",
    btn_autofill: "⚡ コードを自動入力",
    field_reset_code: "再設定コード",
    field_new_password: "新しいパスワード",
    field_confirm_password: "新しいパスワード（確認）",
    placeholder_min12: "12文字以上",
    placeholder_reenter: "パスワードを再入力",
    btn_update_password: "パスワードを更新",
    register_eyebrow: "ゲスト会員登録",
    register_title: "アカウント作成。",
    register_intro: "MOM'S KID HOTEL ゲスト会員にご登録いただくと、宿泊予約や特別リクエストの管理が簡単に行えます。",
    field_create_password: "パスワード作成",
    btn_register_submit: "アカウントを作成",
    otp_eyebrow: "二要素認証",
    otp_title: "ご本人様確認。",
    otp_intro: "{dest} 宛に6桁のセキュリティコードを発行しました。メール（迷惑メールフォルダ含む）をご確認のうえ、入力してください。",
    otp_demo_title: "即時2FAコード（デモモード）",
    field_otp_code: "6桁の認証コードを入力",
    btn_verify_enter: "認証してポータルに入る",
    btn_resend_code: "認証コードを再送信",
    otp_hint_title: "コードが届きませんか？",
    otp_hint_spam: "迷惑メール（Spam）フォルダをご確認ください。",
    otp_hint_terminal: "ローカル開発環境では、サーバーターミナルにも認証コードが表示されます。",
    btn_logout: "サインアウト",
    admin_heading_title: "総支配人スイート統括管理",
    admin_heading_intro: "ホテル運営、客室在庫、予約管理、ユーザーアカウント、システムセキュリティを網羅的に管理。",
    manager_heading_title: "オペレーションラウンジ",
    manager_heading_intro: "日々のホテル運営、フロント対応、客室清掃状況、チーム業務の統括。",
    staff_heading_title: "ゲストサービス＆フロント",
    staff_heading_intro: "迅速なチェックイン・チェックアウト、客室リアルタイム状況確認。",
    customer_heading_title: "マイ・ゲストエクスペリエンス",
    customer_heading_intro: "MOM'S KID HOTEL へようこそ。ご予約状況の確認や新しいステイのご予約はこちらから。",
    tab_overview: "概要",
    tab_rooms: "客室＆スイート",
    tab_bookings: "予約一覧",
    tab_users: "アクティブアカウント",
    tab_deleted_users: "アーカイブ済みアカウント",
    tab_audit: "セキュリティ監査",
    tab_backups: "暗号化バックアップ",
    tab_catalog: "客室予約・検索",
    tab_profile: "アカウントとセキュリティ",
    tab_frontdesk: "フロント・チェックイン",
    tab_customers: "顧客名簿",
    tab_team: "チームメンバー",
    tab_my_stays: "ご宿泊・予約履歴",
    metric_total_rooms: "総客室数",
    metric_occupied_rooms: "利用中客室",
    metric_confirmed_stays: "確定予約数",
    metric_in_house: "滞在中ゲスト",
    metric_active_users: "有効アカウント数",
    metric_archived_users: "アーカイブ済み",
    metric_upcoming_stays: "今後の滞在",
    metric_staff_members: "スタッフ数",
    metric_pending_checkins: "本日チェックイン予定",
    metric_rooms_cleaning: "清掃中客室",
    metric_2fa_status: "2FAセキュリティ",
    metric_active: "有効",
    sec_quick_ops: "クイック操作",
    sec_recent_reservations: "最近の予約",
    sec_room_directory: "客室一覧と空室状況",
    sec_all_reservations: "全予約リスト",
    sec_active_accounts: "アカウント名簿",
    sec_create_account: "新規アカウント登録（スタッフ・マネージャー・ゲスト）",
    sec_deleted_archive: "削除済みアカウントアーカイブ（監査記録）",
    sec_audit_log: "監査ログとアクティビティ",
    sec_encrypted_backups: "暗号化データベースバックアップ",
    sec_todays_arrivals: "本日の到着とフロント業務",
    sec_room_inventory: "客室状況と清掃ステータス",
    sec_guest_reservations: "ゲスト予約管理",
    sec_team_directory: "スタッフ一覧",
    sec_add_staff: "スタッフ・ゲストアカウント追加",
    sec_operational_audit: "業務監査アクティビティ",
    sec_quick_queue: "チェックイン・出発キュー",
    sec_live_availability: "リアルタイム客室空き状況",
    sec_reservations_directory: "予約ディレクトリー",
    sec_customer_directory: "登録顧客名簿",
    sec_your_reservations: "お客様のご予約",
    sec_available_rooms: "予約可能な客室・スイート",
    sec_account_credentials: "アカウント認証と権限",
    quick_view_reservations: "すべての予約を表示",
    quick_manage_rooms: "客室管理",
    quick_create_account: "新規アカウント発行",
    quick_view_archive: "削除アーカイブを確認",
    btn_explore_rooms: "客室を探して予約する",
    search_accounts_placeholder: "メールアドレスまたはロールで検索…",
    hint_active_users: "件のアクティブユーザー",
    empty_accounts: "アカウントが見つかりません。",
    th_id: "ID",
    th_email: "メールアドレス",
    th_role: "権限 / ロール",
    th_created: "登録日",
    th_actions: "操作",
    hint_protected_admin: "保護された管理者",
    btn_archive_delete: "アーカイブ＆削除",
    btn_save: "保存",
    search_deleted_placeholder: "削除済みアカウントを検索…",
    hint_archived_accounts: "件のアーカイブ",
    empty_deleted_archive: "アーカイブされたアカウントはありません。管理者が削除した記録はここに永続保存されます。",
    th_archive_num: "アーカイブ #",
    th_orig_id: "元ID",
    th_orig_role: "元ロール",
    th_deleted_at: "削除日時",
    th_deleted_by: "削除者",
    th_reason: "理由",
    search_rooms_placeholder: "部屋番号、タイプ、設備で検索…",
    btn_add_room: "+ 客室を追加",
    th_room_num: "部屋番号",
    th_room_type: "客室タイプ",
    th_price_night: "料金 / 泊",
    th_capacity: "定員",
    th_amenities: "設備・アメニティ",
    th_status: "状況",
    btn_change_status: "状態変更",
    btn_delete: "削除",
    search_bookings_placeholder: "予約番号、ゲスト名、部屋番号で検索…",
    hint_reservations: "件の予約",
    empty_bookings: "現在予約はありません。",
    th_booking_ref: "予約番号",
    th_guest_contact: "ゲスト名と連絡先",
    th_room: "客室",
    th_dates: "宿泊日程",
    th_total_price: "合計金額",
    btn_checkin: "チェックイン",
    btn_checkout: "チェックアウト",
    btn_cancel: "予約取消",
    btn_reserve_room: "この部屋を予約",
    price_per_night: "/ 泊",
    guests_suffix: "名",
    search_audit_placeholder: "セキュリティ監査ログを検索…",
    empty_audit: "アクティビティ履歴はありません。",
    th_audit_action: "イベント内容",
    th_audit_actor_subject: "実行者と対象",
    th_audit_datetime: "日時",
    field_temp_password: "初期パスワード",
    field_entity: "権限ロール",
    hint_temp_password: "12文字以上。初回サインイン時にメール認証が必要です。",
    btn_create_account_submit: "アカウントを作成",
    btn_trigger_backup: "今すぐ暗号化バックアップを作成",
    backup_desc_auto: "暗号化ローカルスナップショットは24時間ごとに自動実行されます。",
    backup_cloud_enabled: "オンライン AWS S3 クラウドコピーが有効です。",
    backup_cloud_disabled: "ローカル暗号化バックアップが有効です。クラウドコピーを有効にするには AWS S3 設定を行ってください。",
    modal_book_title: "客室 {number} 号室の予約",
    modal_book_name: "ご宿泊者名（氏名）",
    modal_book_email: "メールアドレス",
    modal_book_phone: "電話番号（任意）",
    modal_book_checkin: "チェックイン日",
    modal_book_checkout: "チェックアウト日",
    modal_book_guests: "宿泊人数",
    modal_book_requests: "特別リクエスト（任意）",
    modal_book_submit: "予約を確定する",
    modal_add_room_title: "新しい客室の登録",
    modal_room_num: "部屋番号",
    modal_room_type: "客室タイプ / 名称",
    modal_price_night: "1泊料金 ($)",
    modal_capacity: "最大定員",
    modal_amenities: "客室設備・備品",
    modal_initial_status: "初期ステータス",
    modal_desc: "客室説明",
    modal_create_room_submit: "客室を登録",
    modal_edit_status_title: "客室 {number} 号室のステータス変更",
    modal_select_new_status: "新しいステータスを選択",
    modal_update_status_submit: "ステータスを更新",
    modal_delete_user_title: "アカウントのアーカイブと削除",
    modal_delete_user_prompt: "本当に {email} の {role} アカウントを完全削除しますか？",
    modal_delete_archive_guarantee: "永続的アーカイブ保証：",
    modal_delete_archive_info: "このアカウントのアクセス権は即座に無効化され、進行中のセッションや認証コードは破棄されます。管理者のメールアドレスとタイムスタンプとともにアーカイブに永久保存されます。",
    modal_delete_reason: "削除理由",
    modal_delete_submit: "完全に削除してアーカイブ",
    modal_cancel: "キャンセル",
    status_available: "空室（利用可能）",
    status_occupied: "利用中",
    status_cleaning: "清掃中",
    status_maintenance: "メンテナンス中",
    status_confirmed: "予約確定",
    status_checked_in: "チェックイン済",
    status_checked_out: "チェックアウト済",
    status_cancelled: "キャンセル済",
    label_registered_email: "登録メールアドレス",
    msg_passwords_mismatch: "パスワードが一致しません。",
    toast_lang_set: "言語を {lang} に変更しました",
    toast_time_set: "時刻表示を {format} に変更しました",
    toast_prefs_restored: "システム設定を初期状態に復元しました。",
  },

  ar: {
    hero_guest_eyebrow: "تجربة فندق MOM'S KID الاستثنائية",
    hero_guest_title: "مرحبًا بكم في بيتكم الثاني.",
    hero_guest_caption: "ضيافة دافئة، تفاصيل راقية، وإقامة لا تُنسى في كل لحظة.",
    hero_admin_eyebrow: "جناح المدير العام",
    hero_admin_title: "إدارة الفندق بالكامل برؤية شاملة.",
    hero_admin_caption: "مركز تحكم متكامل لمتابعة الأداء، وفريق العمل، والأمان، وجودة الخدمة الفندقية.",
    hero_manager_eyebrow: "صالة العمليات والتشغيل",
    hero_manager_title: "الإقامة المثالية تبدأ بالتنظيم الدقيق.",
    hero_manager_caption: "قيادة الفريق الفندقي لضمان سير العمليات اليومية للضيوف بكل كفاءة وسلاسة.",
    hero_staff_eyebrow: "مكتب خدمات الضيوف والاستقبال",
    hero_staff_title: "كل لمسة واهتمام يصنع الفارق.",
    hero_staff_caption: "واجهة استقبال تضع سجل الضيوف في متناول اليد مع روح الضيافة الأصيلة.",
    hero_customer_eyebrow: "بوابة الضيوف الخاصة",
    hero_customer_title: "إقامتكم مصممة خصيصًا لراحتكم.",
    hero_customer_caption: "مساحة مريحة لمتابعة تفاصيل حجوزاتكم والشعور وكأنكم في منزلكم قبل الوصول.",
    pref_restore: "استعادة الإعدادات الافتراضية",
    pref_restore_title: "استعادة إعدادات النظام (المظهر، وضع العرض، تنسيق الوقت، اللغة) دون المساس بالبيانات",
    pref_restore_confirm: "هل تريد بالتأكيد استعادة تفضيلات النظام إلى الإعدادات الافتراضية الأصلية؟\n\n(ملاحظة: جميع حسابات المستخدمين والغرف والحجوزات ستبقى كما هي تمامًا.)",
    mode_auto: "الوضع التلقائي",
    mode_light: "الوضع النهاري",
    mode_dark: "الوضع الليلي",
    time_12h: "تنسيق 12 ساعة",
    time_24h: "تنسيق 24 ساعة",
    role_guest: "نزيل",
    role_staff: "موظف",
    role_manager: "مدير",
    role_admin: "مسؤول",
    role_title_admin: "مدير عام الفندق / المسؤول",
    role_title_manager: "مدير العمليات الفندقية",
    role_title_staff: "موظف خدمة الضيوف والاستقبال",
    role_title_customer: "ضيف الفندق الكريم",
    login_eyebrow: "بوابة الضيوف وفريق العمل",
    login_title: "أهلاً بعودتكم.",
    login_intro: "تسجيل الدخول إلى فندق MOM'S KID HOTEL. اختر نوع الحساب وأدخل بيانات الاعتماد الخاصة بك.",
    login_2fa_badge: "المصادقة الثنائية (2FA) مفعلة لحماية حسابك.",
    login_demo_title: "وضع العرض التجريبي: رمز التحقق المباشر مفعل",
    login_demo_desc: "خدمة إرسال البريد المباشر غير مهيأة. سيظهر رمز الأمان المكون من 6 أرقام على الشاشة لتسجيل الدخول السريع.",
    field_account_type: "نوع الحساب",
    field_email: "البريد الإلكتروني",
    field_password: "كلمة المرور",
    btn_show: "إظهار",
    btn_hide: "إخفاء",
    remember_device: "تذكر هذا الجهاز",
    forgot_password: "نسيت كلمة المرور؟",
    btn_signin: "تسجيل الدخول إلى البوابة",
    new_guest_prompt: "هل أنت ضيف جديد في فندقنا؟",
    btn_create_account: "إنشاء حساب نزيل جديد",
    forgot_eyebrow: "استعادة الحساب",
    forgot_title: "إعادة تعيين كلمة المرور.",
    forgot_intro: "أدخل عنوان البريد الإلكتروني المسجل لدينا. سنرسل لك رمز إعادة التعيين صالح لمدة 10 دقائق.",
    btn_send_reset: "إرسال رمز إعادة التعيين",
    btn_back_login: "العودة إلى تسجيل الدخول",
    reset_eyebrow: "إعادة تعيين آمنة لكلمة المرور",
    reset_title: "تعيين كلمة مرور جديدة.",
    reset_intro: "أدخل رمز إعادة التعيين المكون من 6 أرقام واختر كلمة مرور جديدة لا تقل عن 12 حرفًا.",
    reset_demo_title: "رمز إعادة التعيين الفوري (الوضع التجريبي)",
    btn_autofill: "⚡ ملء الرمز تلقائيًا",
    field_reset_code: "رمز إعادة التعيين",
    field_new_password: "كلمة المرور الجديدة",
    field_confirm_password: "تأكيد كلمة المرور الجديدة",
    placeholder_min12: "12 حرفًا كحد أدنى",
    placeholder_reenter: "أعد إدخال كلمة المرور الجديدة",
    btn_update_password: "تحديث كلمة المرور",
    register_eyebrow: "تسجيل نزيل جديد",
    register_title: "إنشاء حسابكم الخاص.",
    register_intro: "انضم إلى ضيوف MOM'S KID HOTEL المميزين واستمتع بحجز الغرف بكل سهولة ومتابعة إقامتك.",
    field_create_password: "إنشاء كلمة المرور",
    btn_register_submit: "إنشاء حساب النزيل",
    otp_eyebrow: "المصادقة الثنائية",
    otp_title: "التحقق من هويتكم.",
    otp_intro: "تم إصدار رمز أمان مكون من ستة أرقام لـ {dest}. يرجى مراجعة بريدكم الإلكتروني (بما في ذلك مجلد الرسائل غير المرغوب فيها) وإدخاله أدناه.",
    otp_demo_title: "رمز التحقق الفوري (الوضع التجريبي)",
    field_otp_code: "أدخل رمز التحقق المكون من 6 أرقام",
    btn_verify_enter: "تأكيد والدخول إلى البوابة",
    btn_resend_code: "إعادة إرسال رمز التحقق",
    otp_hint_title: "لم تستلم الرمز بعد؟",
    otp_hint_spam: "يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam / Junk).",
    otp_hint_terminal: "في بيئة التطوير المحلية، يُطبع الرمز أيضًا مباشرة في سطر أوامر الخادم (Terminal).",
    btn_logout: "تسجيل الخروج",
    admin_heading_title: "جناح الإدارة العامة الشامل",
    admin_heading_intro: "إشراف كامل على عمليات الفندق، والغرف، والحجوزات، والمستخدمين، وسلامة النظام.",
    manager_heading_title: "صالة إدارة العمليات الفندقية",
    manager_heading_intro: "تنسيق العمل اليومي للخدمات، ونظافة الغرف، وإدارة الحجوزات ونشاط الموظفين.",
    staff_heading_title: "خدمات الضيوف ومكتب الاستقبال",
    staff_heading_intro: "تسجيل الوصول والمغادرة السريع، ومتابعة جدول الغرف الشاغرة والنظافة.",
    customer_heading_title: "تجربة الضيف الشخصية",
    customer_heading_intro: "مرحبًا بكم في فندق MOM'S KID. استعرضوا حجوزاتكم وتصفحوا الأجنحة الفاخرة المتاحة.",
    tab_overview: "نظرة عامة",
    tab_rooms: "الغرف والأجنحة",
    tab_bookings: "الحجوزات",
    tab_users: "الحسابات النشطة",
    tab_deleted_users: "أرشيف المحذوفات",
    tab_audit: "سجل الأمان والتدقيق",
    tab_backups: "النسخ الاحتياطي المشفر",
    tab_catalog: "تصفح وحجز الغرف",
    tab_profile: "الحساب والأمان",
    tab_frontdesk: "الاستقبال والدخول",
    tab_customers: "دليل العملاء",
    tab_team: "فريق العمل",
    tab_my_stays: "إقاماتي وحجوزاتي",
    metric_total_rooms: "إجمالي الغرف",
    metric_occupied_rooms: "الغرف المشغولة",
    metric_confirmed_stays: "الحجوزات المؤكدة",
    metric_in_house: "الضيوف الحاليون",
    metric_active_users: "المستخدمون النشطون",
    metric_archived_users: "الحسابات المؤرشفة",
    metric_upcoming_stays: "الحجوزات القادمة",
    metric_staff_members: "فريق الموظفين",
    metric_pending_checkins: "وصول اليوم المنتظر",
    metric_rooms_cleaning: "غرف تحت التنظيف",
    metric_2fa_status: "أمان المصادقة الثنائية",
    metric_active: "مفعل",
    sec_quick_ops: "عمليات سريعة",
    sec_recent_reservations: "أحدث الحجوزات",
    sec_room_directory: "دليل وتوافر الغرف",
    sec_all_reservations: "كافة حجوزات النزلاء",
    sec_active_accounts: "دليل الحسابات النشطة",
    sec_create_account: "إنشاء حساب موظف أو مدير أو عميل جديد",
    sec_deleted_archive: "أرشيف الحسابات المحذوفة (سجل تدقيق دائم)",
    sec_audit_log: "سجل التدقيق ونشاط الأمان",
    sec_encrypted_backups: "النسخ الاحتياطي المشفر لقاعدة البيانات",
    sec_todays_arrivals: "وصول اليوم وخدمات الاستقبال",
    sec_room_inventory: "حالة الغرف ونظافتها",
    sec_guest_reservations: "حجوزات الضيوف",
    sec_team_directory: "دليل فريق العمل",
    sec_add_staff: "إضافة حساب موظف أو نزيل",
    sec_operational_audit: "نشاط التدقيق التشغيلي",
    sec_quick_queue: "طابور الدخول والخروج السريع",
    sec_live_availability: "توافر الغرف اللحظي",
    sec_reservations_directory: "سجل الحجوزات الكامل",
    sec_customer_directory: "النزلاء المسجلون",
    sec_your_reservations: "حجوزاتك الخاصة",
    sec_available_rooms: "الغرف والأجنحة المتاحة للحجز",
    sec_account_credentials: "صلاحيات وبيانات الحساب",
    quick_view_reservations: "عرض كافة الحجوزات",
    quick_manage_rooms: "إدارة مخزون الغرف",
    quick_create_account: "إصدار حساب جديد",
    quick_view_archive: "عرض الأرشيف المحذوف",
    btn_explore_rooms: "استكشاف الغرف وحجز إقامة",
    search_accounts_placeholder: "تصفية الحسابات بالبريد أو الدور…",
    hint_active_users: "مستخدمين نشطين",
    empty_accounts: "لم يتم العثور على حسابات.",
    th_id: "المعرف",
    th_email: "البريد الإلكتروني",
    th_role: "الدور / الصلاحية",
    th_created: "تاريخ الإنشاء",
    th_actions: "الإجراءات",
    hint_protected_admin: "مسؤول محمي",
    btn_archive_delete: "أرشفة وحذف",
    btn_save: "حفظ",
    search_deleted_placeholder: "البحث في الحسابات المحذوفة…",
    hint_archived_accounts: "حسابات مؤرشفة",
    empty_deleted_archive: "لا توجد حسابات في الأرشيف المحذوف. عندما يقوم المسؤول بحذف حساب، يُحفظ السجل التاريخي هنا بشكل دائم.",
    th_archive_num: "رقم الأرشيف",
    th_orig_id: "المعرف الأصلي",
    th_orig_role: "الدور الأصلي",
    th_deleted_at: "تاريخ الحذف",
    th_deleted_by: "تم الحذف بواسطة",
    th_reason: "السبب",
    search_rooms_placeholder: "البحث برقم الغرفة، النوع، المرافق…",
    btn_add_room: "+ إضافة غرفة جديدة",
    th_room_num: "رقم الغرفة",
    th_room_type: "نوع الغرفة",
    th_price_night: "السعر / الليلة",
    th_capacity: "السعة",
    th_amenities: "المرافق والخدمات",
    th_status: "الحالة",
    btn_change_status: "تعديل الحالة",
    btn_delete: "حذف",
    search_bookings_placeholder: "البحث برقم الحجز، اسم الضيف، أو الغرفة…",
    hint_reservations: "حجوزات",
    empty_bookings: "لا توجد حجوزات مسجلة حتى الآن.",
    th_booking_ref: "رقم المرجع",
    th_guest_contact: "اسم الضيف وبيانات الاتصال",
    th_room: "الغرفة",
    th_dates: "التواريخ",
    th_total_price: "المبلغ الإجمالي",
    btn_checkin: "تسجيل الوصول",
    btn_checkout: "تسجيل المغادرة",
    btn_cancel: "إلغاء الحجز",
    btn_reserve_room: "حجز هذه الغرفة",
    price_per_night: "/ ليلة",
    guests_suffix: "نزلاء",
    search_audit_placeholder: "البحث في سجل الأمان…",
    empty_audit: "لا يوجد نشاط مسجل بعد.",
    th_audit_action: "نوع الحدث",
    th_audit_actor_subject: "المنفذ والموضوع",
    th_audit_datetime: "التاريخ والوقت",
    field_temp_password: "كلمة المرور المؤقتة",
    field_entity: "نوع الحساب",
    hint_temp_password: "12 حرفًا على الأقل. يجب تفعيل الحساب عبر البريد عند أول تسجيل دخول.",
    btn_create_account_submit: "إنشاء الحساب",
    btn_trigger_backup: "إنشاء نسخة احتياطية مشفرة الآن",
    backup_desc_auto: "يتم إنشاء لقطات محلية مشفرة تلقائيًا كل 24 ساعة.",
    backup_cloud_enabled: "النسخ الاحتياطي السحابي عبر AWS S3 مفعل.",
    backup_cloud_disabled: "النسخ المحلي المشفر نشط. لتفعيل النسخ السحابي، قم بضبط إعدادات AWS S3.",
    modal_book_title: "حجز الغرفة {number}",
    modal_book_name: "اسم الضيف الكامل",
    modal_book_email: "البريد الإلكتروني للضيف",
    modal_book_phone: "رقم الهاتف (اختياري)",
    modal_book_checkin: "تاريخ الوصول",
    modal_book_checkout: "تاريخ المغادرة",
    modal_book_guests: "عدد النزلاء",
    modal_book_requests: "طلبات خاصة (اختياري)",
    modal_book_submit: "تأكيد وإتمام الحجز",
    modal_add_room_title: "إضافة غرفة جديدة",
    modal_room_num: "رقم الغرفة",
    modal_room_type: "نوع الغرفة / المسمى",
    modal_price_night: "السعر / الليلة ($)",
    modal_capacity: "الحد الأقصى للنزلاء",
    modal_amenities: "المرافق والخدمات",
    modal_initial_status: "الحالة الأولية",
    modal_desc: "وصف الغرفة",
    modal_create_room_submit: "إنشاء الغرفة",
    modal_edit_status_title: "تحديث حالة الغرفة {number}",
    modal_select_new_status: "اختر الحالة الجديدة للغرفة",
    modal_update_status_submit: "تحديث حالة الغرفة",
    modal_delete_user_title: "أرشفة وحذف الحساب نهائيًا",
    modal_delete_user_prompt: "هل أنت متأكد من رغبتك في حذف حساب {role} المسجل باسم {email} نهائيًا؟",
    modal_delete_archive_guarantee: "ضمان الأرشفة الدائمة:",
    modal_delete_archive_info: "سيتم تجريد هذا الحساب من جميع صلاحيات الدخول، وإلغاء صلاحية الجلسات ورموز التحقق، وحفظ سجل تدقيق دائم وموثق باسم المسؤول ووقت التنفيذ.",
    modal_delete_reason: "سبب حذف الحساب",
    modal_delete_submit: "أرشفة وحذف نهائي",
    modal_cancel: "إلغاء",
    status_available: "متاحة للطلب",
    status_occupied: "مشغولة",
    status_cleaning: "تحت التنظيف",
    status_maintenance: "تحت الصيانة",
    status_confirmed: "مؤكد",
    status_checked_in: "تم الوصول",
    status_checked_out: "تم المغادرة",
    status_cancelled: "ملغى",
    label_registered_email: "البريد المسجل",
    msg_passwords_mismatch: "كلمتا المرور غير متطابقتين.",
    toast_lang_set: "تم تعيين اللغة إلى {lang}",
    toast_time_set: "تم تعيين تنسيق الوقت إلى {format}",
    toast_prefs_restored: "تمت استعادة إعدادات النظام الافتراضية بنجاح.",
  },

  pt: {
    hero_guest_eyebrow: "A EXPERIÊNCIA MOM'S KID HOTEL",
    hero_guest_title: "Bem-vindo à sua casa longe de casa.",
    hero_guest_caption: "Hospitalidade calorosa, detalhes atenciosos e uma estadia inesquecível.",
    hero_admin_eyebrow: "A SUÍTE DA DIREÇÃO-GERAL",
    hero_admin_title: "Todo o hotel sob controle.",
    hero_admin_caption: "Centro de comando integrado para pessoas, desempenho, segurança e excelência em hospitalidade.",
    hero_manager_eyebrow: "O LOUNGE DE OPERAÇÕES",
    hero_manager_title: "Uma excelente estadia começa aqui.",
    hero_manager_caption: "Coordene a equipe e mantenha as operações dos hóspedes com confiança e dedicação.",
    hero_staff_eyebrow: "A RECEPÇÃO E SERVIÇO AO CLIENTE",
    hero_staff_title: "Cada detalhe faz a diferença.",
    hero_staff_caption: "Seu espaço de atendimento mantém o diretório de hóspedes acessível com espírito acolhedor.",
    hero_customer_eyebrow: "SEU PORTAL EXCLUSIVO DE HÓSPEDE",
    hero_customer_title: "Sua estadia, sob medida.",
    hero_customer_caption: "Um espaço acolhedor para consultar suas reservas e se sentir em casa antes de chegar.",
    pref_restore: "Restaurar Padrões",
    pref_restore_title: "Restaurar preferências do sistema (tema, modo de exibição, formato de hora, idioma) sem alterar dados",
    pref_restore_confirm: "Deseja restaurar as preferências do sistema (modo de exibição, idioma, formato de hora) aos padrões de fábrica?\n\n(Nota: Todas as contas de usuários, quartos e reservas permanecerão intactos.)",
    mode_auto: "Modo Automático",
    mode_light: "Modo Claro",
    mode_dark: "Modo Escuro",
    time_12h: "12 Horas",
    time_24h: "24 Horas",
    role_guest: "Hóspede",
    role_staff: "Equipe",
    role_manager: "Gerente",
    role_admin: "Administrador",
    role_title_admin: "Administrador do Hotel",
    role_title_manager: "Gerente de Operações",
    role_title_staff: "Equipe de Atendimento",
    role_title_customer: "Hóspede Estimado",
    login_eyebrow: "Acesso de Hóspedes e Equipe",
    login_title: "Bem-vindo de volta.",
    login_intro: "Acesse o portal MOM'S KID HOTEL. Selecione o tipo de conta e informe suas credenciais.",
    login_2fa_badge: "Autenticação em Dois Fatores (2FA) ativa para proteção da conta.",
    login_demo_title: "Modo Demonstração: Código 2FA Instantâneo Ativo",
    login_demo_desc: "Envio de e-mail ao vivo não configurado. Seu código de 6 dígitos será exibido diretamente na tela.",
    field_account_type: "Tipo de conta",
    field_email: "Endereço de e-mail",
    field_password: "Senha",
    btn_show: "Exibir",
    btn_hide: "Ocultar",
    remember_device: "Lembrar este dispositivo",
    forgot_password: "Esqueceu a senha?",
    btn_signin: "Entrar no Portal",
    new_guest_prompt: "Novo no MOM'S KID HOTEL?",
    btn_create_account: "Criar Conta de Hóspede",
    forgot_eyebrow: "Recuperação de Conta",
    forgot_title: "Redefinir sua senha.",
    forgot_intro: "Digite o e-mail cadastrado em sua conta. Enviaremos um código de recuperação válido por 10 minutos.",
    btn_send_reset: "Enviar Código de Redefinição",
    btn_back_login: "Voltar ao Login",
    reset_eyebrow: "Redefinição Segura de Senha",
    reset_title: "Criar nova senha.",
    reset_intro: "Insira o código de 6 dígitos e escolha uma nova senha com no mínimo 12 caracteres.",
    reset_demo_title: "Código de Redefinição Instantâneo (Modo Demonstração)",
    btn_autofill: "⚡ Preencher Código Automaticamente",
    field_reset_code: "Código de redefinição",
    field_new_password: "Nova senha",
    field_confirm_password: "Confirmar nova senha",
    placeholder_min12: "Mínimo de 12 caracteres",
    placeholder_reenter: "Digite novamente a nova senha",
    btn_update_password: "Atualizar Senha",
    register_eyebrow: "Cadastro de Hóspede",
    register_title: "Crie sua conta.",
    register_intro: "Junte-se ao MOM'S KID HOTEL como hóspede registrado. Reserve quartos facilmente e acompanhe suas viagens.",
    field_create_password: "Criar senha",
    btn_register_submit: "Criar Conta de Hóspede",
    otp_eyebrow: "Autenticação em Dois Fatores",
    otp_title: "Confirme sua identidade.",
    otp_intro: "Um código de segurança de seis dígitos foi emitido para {dest}. Verifique sua caixa de entrada (inclusive pasta de Spam/Lixo Eletrônico) e digite-o abaixo.",
    otp_demo_title: "Código 2FA Instantâneo (Modo Demonstração)",
    field_otp_code: "Digite o código de 6 dígitos",
    btn_verify_enter: "Verificar e Entrar",
    btn_resend_code: "Reenviar Código de Verificação",
    otp_hint_title: "Não recebeu o código?",
    otp_hint_spam: "Por favor, verifique sua pasta de Spam ou Lixo Eletrônico.",
    otp_hint_terminal: "No ambiente de desenvolvimento local, o código de 6 dígitos também é exibido no console do servidor.",
    btn_logout: "Sair",
    admin_heading_title: "Suíte da Direção-Geral",
    admin_heading_intro: "Controle total das operações do hotel, inventário de quartos, reservas, usuários e segurança do sistema.",
    manager_heading_title: "Lounge de Operações",
    manager_heading_intro: "Coordene as operações diárias, atendimento aos hóspedes, status de quartos e equipe.",
    staff_heading_title: "Recepção e Serviços ao Hóspede",
    staff_heading_intro: "Recepção ágil, check-in e check-out simplificados e disponibilidade em tempo real.",
    customer_heading_title: "Sua Experiência como Hóspede",
    customer_heading_intro: "Bem-vindo ao MOM'S KID HOTEL. Consulte suas reservas e explore acomodações disponíveis.",
    tab_overview: "Visão Geral",
    tab_rooms: "Quartos e Suítes",
    tab_bookings: "Reservas",
    tab_users: "Contas Ativas",
    tab_deleted_users: "Contas Arquivadas",
    tab_audit: "Auditoria e Segurança",
    tab_backups: "Backups Criptografados",
    tab_catalog: "Explorar e Reservar",
    tab_profile: "Conta e Segurança",
    tab_frontdesk: "Recepção e Check-in",
    tab_customers: "Diretório de Clientes",
    tab_team: "Membros da Equipe",
    tab_my_stays: "Minhas Estadias",
    metric_total_rooms: "Total de Quartos",
    metric_occupied_rooms: "Quartos Ocupados",
    metric_confirmed_stays: "Reservas Confirmadas",
    metric_in_house: "Hóspedes Atuais",
    metric_active_users: "Usuários Ativos",
    metric_archived_users: "Usuários Arquivados",
    metric_upcoming_stays: "Próximas Estadias",
    metric_staff_members: "Membros da Equipe",
    metric_pending_checkins: "Check-ins Pendentes",
    metric_rooms_cleaning: "Quartos em Limpeza",
    metric_2fa_status: "Segurança 2FA",
    metric_active: "Ativo",
    sec_quick_ops: "Operações Rápidas",
    sec_recent_reservations: "Reservas Recentes",
    sec_room_directory: "Diretório e Disponibilidade de Quartos",
    sec_all_reservations: "Todas as Reservas de Hóspedes",
    sec_active_accounts: "Diretório de Contas Ativas",
    sec_create_account: "Criar Conta de Equipe, Gerente ou Hóspede",
    sec_deleted_archive: "Arquivo de Contas Excluídas (Auditoria Permanente)",
    sec_audit_log: "Log de Auditoria e Atividades de Segurança",
    sec_encrypted_backups: "Backups Criptografados do Banco de Dados",
    sec_todays_arrivals: "Chegadas de Hoje e Recepção",
    sec_room_inventory: "Inventário e Limpeza de Quartos",
    sec_guest_reservations: "Reservas de Hóspedes",
    sec_team_directory: "Diretório da Equipe",
    sec_add_staff: "Adicionar Equipe ou Hóspede",
    sec_operational_audit: "Atividades de Auditoria Operacional",
    sec_quick_queue: "Fila de Check-in e Partidas Rápidas",
    sec_live_availability: "Disponibilidade de Quartos em Tempo Real",
    sec_reservations_directory: "Diretório de Reservas",
    sec_customer_directory: "Hóspedes Cadastrados",
    sec_your_reservations: "Suas Reservas",
    sec_available_rooms: "Quartos e Suítes Disponíveis",
    sec_account_credentials: "Credenciais e Acesso da Conta",
    quick_view_reservations: "Ver Todas as Reservas",
    quick_manage_rooms: "Gerenciar Inventário de Quartos",
    quick_create_account: "Criar Nova Conta",
    quick_view_archive: "Ver Arquivo de Contas Excluídas",
    btn_explore_rooms: "Explorar Quartos e Reservar",
    search_accounts_placeholder: "Filtrar contas por e-mail ou perfil…",
    hint_active_users: "usuários ativos",
    empty_accounts: "Nenhuma conta encontrada.",
    th_id: "ID",
    th_email: "E-mail",
    th_role: "Perfil / Acesso",
    th_created: "Criado em",
    th_actions: "Ações",
    hint_protected_admin: "Administrador protegido",
    btn_archive_delete: "Arquivar e Excluir",
    btn_save: "Salvar",
    search_deleted_placeholder: "Pesquisar contas excluídas…",
    hint_archived_accounts: "contas arquivadas",
    empty_deleted_archive: "Nenhuma conta no arquivo de excluídos. Ao excluir um usuário, o registro histórico será preservado aqui.",
    th_archive_num: "Arquivo #",
    th_orig_id: "ID Original",
    th_orig_role: "Perfil Original",
    th_deleted_at: "Excluído em",
    th_deleted_by: "Excluído por",
    th_reason: "Motivo",
    search_rooms_placeholder: "Buscar por número, tipo, comodidades…",
    btn_add_room: "+ Adicionar Quarto",
    th_room_num: "Quarto nº",
    th_room_type: "Tipo de Quarto",
    th_price_night: "Preço / Noite",
    th_capacity: "Capacidade",
    th_amenities: "Comodidades",
    th_status: "Status",
    btn_change_status: "Alterar Status",
    btn_delete: "Excluir",
    search_bookings_placeholder: "Buscar por referência, nome do hóspede ou quarto…",
    hint_reservations: "reservas",
    empty_bookings: "Nenhuma reserva registrada ainda.",
    th_booking_ref: "Referência",
    th_guest_contact: "Nome do Hóspede e Contato",
    th_room: "Quarto",
    th_dates: "Datas",
    th_total_price: "Preço Total",
    btn_checkin: "Check-In",
    btn_checkout: "Check-Out",
    btn_cancel: "Cancelar Reserva",
    btn_reserve_room: "Reservar Quarto",
    price_per_night: "/ noite",
    guests_suffix: "hóspedes",
    search_audit_placeholder: "Pesquisar log de segurança…",
    empty_audit: "Nenhuma atividade registrada ainda.",
    th_audit_action: "Ação do Evento",
    th_audit_actor_subject: "Autor e Objeto",
    th_audit_datetime: "Data e Hora",
    field_temp_password: "Senha temporária",
    field_entity: "Entidade",
    hint_temp_password: "Mínimo de 12 caracteres. A conta deverá confirmar o e-mail no primeiro login.",
    btn_create_account_submit: "Criar conta",
    btn_trigger_backup: "Gerar Backup Criptografado Agora",
    backup_desc_auto: "Instantâneos locais criptografados são criados automaticamente a cada 24 horas.",
    backup_cloud_enabled: "Cópia remota online em nuvem AWS S3 ativada.",
    backup_cloud_disabled: "Backups locais criptografados ativos. Para habilitar cópias em nuvem, configure as variáveis AWS S3.",
    modal_book_title: "Reservar Quarto {number}",
    modal_book_name: "Nome Completo do Hóspede",
    modal_book_email: "E-mail do Hóspede",
    modal_book_phone: "Telefone (opcional)",
    modal_book_checkin: "Data de Check-in",
    modal_book_checkout: "Data de Check-out",
    modal_book_guests: "Número de Hóspedes",
    modal_book_requests: "Solicitações Especiais (opcional)",
    modal_book_submit: "Confirmar e Efetuar Reserva",
    modal_add_room_title: "Adicionar Novo Quarto",
    modal_room_num: "Número do Quarto",
    modal_room_type: "Tipo / Título do Quarto",
    modal_price_night: "Preço por Noite ($)",
    modal_capacity: "Capacidade Máxima",
    modal_amenities: "Comodidades",
    modal_initial_status: "Status Inicial",
    modal_desc: "Descrição",
    modal_create_room_submit: "Criar Quarto",
    modal_edit_status_title: "Atualizar Status do Quarto {number}",
    modal_select_new_status: "Selecione o Novo Status",
    modal_update_status_submit: "Atualizar Status",
    modal_delete_user_title: "Arquivar e Excluir Conta",
    modal_delete_user_prompt: "Tem certeza de que deseja excluir permanentemente a conta de {role} para {email}?",
    modal_delete_archive_guarantee: "Garantia de Arquivamento Permanente:",
    modal_delete_archive_info: "Esta conta perderá o acesso ativo imediatamente, todas as sessões e códigos pendentes serão invalidados e um registro permanente será mantido no Arquivo de Excluídos com o e-mail do administrador.",
    modal_delete_reason: "Motivo da Exclusão",
    modal_delete_submit: "Arquivar e Excluir Definitivamente",
    modal_cancel: "Cancelar",
    status_available: "Disponível",
    status_occupied: "Ocupado",
    status_cleaning: "Em Limpeza",
    status_maintenance: "Em Manutenção",
    status_confirmed: "confirmada",
    status_checked_in: "check-in realizado",
    status_checked_out: "check-out realizado",
    status_cancelled: "cancelada",
    label_registered_email: "E-mail Cadastrado",
    msg_passwords_mismatch: "As senhas não coincidem.",
    toast_lang_set: "Idioma alterado para {lang}",
    toast_time_set: "Formato de hora alterado para {format}",
    toast_prefs_restored: "Preferências do sistema restauradas para os padrões.",
  },

  it: {
    hero_guest_eyebrow: "L'ESPERIENZA MOM'S KID HOTEL",
    hero_guest_title: "Benvenuti nella vostra seconda casa.",
    hero_guest_caption: "Calda ospitalità, dettagli curati e un soggiorno memorabile.",
    hero_admin_eyebrow: "SUITE DELLA DIREZIONE GENERALE",
    hero_admin_title: "L'intero hotel sotto controllo.",
    hero_admin_caption: "Un centro di comando chiaro per personale, prestazioni, sicurezza e dettagli dietro ogni soggiorno.",
    hero_manager_eyebrow: "LOUNGE OPERATIVA",
    hero_manager_title: "Un soggiorno perfetto inizia qui.",
    hero_manager_caption: "Guida il team e mantieni le operazioni per gli ospiti con dedizione e professionalità.",
    hero_staff_eyebrow: "DESK SERVIZI OSPITI",
    hero_staff_title: "Ogni attenzione fa la differenza.",
    hero_staff_caption: "La tua postazione di lavoro mette a portata di mano l'elenco degli ospiti con spirito di ospitalità.",
    hero_customer_eyebrow: "IL TUO PORTALE OSPITE PRIVATO",
    hero_customer_title: "Il tuo soggiorno, su misura per te.",
    hero_customer_caption: "Uno spazio accogliente per visualizzare i dettagli del tuo account e sentirti a casa prima dell'arrivo.",
    pref_restore: "Ripristina Predefiniti",
    pref_restore_title: "Ripristina le preferenze di sistema (tema, modalità display, formato orario, lingua) senza toccare i dati",
    pref_restore_confirm: "Ripristinare le preferenze di sistema (modalità, lingua, formato ora) ai valori di fabbrica?\n\n(Nota: Tutti gli account utente, le camere e le prenotazioni rimarranno invariati.)",
    mode_auto: "Modalità Automatica",
    mode_light: "Modalità Chiara",
    mode_dark: "Modalità Scura",
    time_12h: "12 Ore",
    time_24h: "24 Ore",
    role_guest: "Ospite",
    role_staff: "Staff",
    role_manager: "Manager",
    role_admin: "Amministratore",
    role_title_admin: "Amministratore Hotel",
    role_title_manager: "Manager Operativo Hotel",
    role_title_staff: "Staff Servizi Ospiti",
    role_title_customer: "Pregiato Ospite dell'Hotel",
    login_eyebrow: "Accesso Ospiti e Personale",
    login_title: "Bentornati.",
    login_intro: "Accedi al portale MOM'S KID HOTEL. Seleziona il tipo di account e inserisci le tue credenziali.",
    login_2fa_badge: "Autenticazione a Due Fattori (2FA) attiva per la sicurezza dell'account.",
    login_demo_title: "Modalità Demo 2FA Istantanea Attiva",
    login_demo_desc: "Invio e-mail in tempo reale non configurato. Il codice di verifica a 6 cifre verrà mostrato direttamente a schermo.",
    field_account_type: "Tipo di account",
    field_email: "Indirizzo e-mail",
    field_password: "Password",
    btn_show: "Mostra",
    btn_hide: "Nascondi",
    remember_device: "Ricorda questo dispositivo",
    forgot_password: "Password dimenticata?",
    btn_signin: "Accedi al Portale",
    new_guest_prompt: "Nuovo ospite a MOM'S KID HOTEL?",
    btn_create_account: "Crea Account Ospite",
    forgot_eyebrow: "Recupero Account",
    forgot_title: "Reimposta la tua password.",
    forgot_intro: "Inserisci l'indirizzo e-mail registrato con il tuo account. Invieremo un codice valido per 10 minuti.",
    btn_send_reset: "Invia Codice di Reimpostazione",
    btn_back_login: "Torna ad Accedi",
    reset_eyebrow: "Reimpostazione Sicura della Password",
    reset_title: "Crea una nuova password.",
    reset_intro: "Inserisci il codice di reimpostazione a sei cifre e scegli una nuova password di almeno 12 caratteri.",
    reset_demo_title: "Codice di Reimpostazione Istantaneo (Modalità Demo)",
    btn_autofill: "⚡ Compila Codice Automaticamente",
    field_reset_code: "Codice di reimpostazione",
    field_new_password: "Nuova password",
    field_confirm_password: "Conferma nuova password",
    placeholder_min12: "Almeno 12 caratteri",
    placeholder_reenter: "Reinserisci la nuova password",
    btn_update_password: "Aggiorna Password",
    register_eyebrow: "Registrazione Ospite",
    register_title: "Crea il tuo account.",
    register_intro: "Unisciti a MOM'S KID HOTEL come ospite registrato. Prenota camere facilmente e monitora i tuoi soggiorni.",
    field_create_password: "Crea password",
    btn_register_submit: "Crea Account Ospite",
    otp_eyebrow: "Autenticazione a Due Fattori",
    otp_title: "Verifica la tua identità.",
    otp_intro: "Un codice di sicurezza di sei cifre è stato emesso per {dest}. Controlla la tua casella e-mail (inclusa la cartella Spam) e inseriscilo qui sotto.",
    otp_demo_title: "Codice 2FA Istantaneo (Modalità Demo)",
    field_otp_code: "Inserisci il codice a 6 cifre",
    btn_verify_enter: "Verifica ed Entra",
    btn_resend_code: "Reinvia Codice di Verifica",
    otp_hint_title: "Non hai ricevuto il codice?",
    otp_hint_spam: "Controlla la tua cartella Posta indesiderata o Spam.",
    otp_hint_terminal: "In ambiente di sviluppo locale, il codice a 6 cifre viene stampato anche nel terminale del server.",
    btn_logout: "Disconnetti",
    admin_heading_title: "Suite Direzione Generale",
    admin_heading_intro: "Supervisione completa delle operazioni alberghiere, inventario camere, prenotazioni, account e integrità del sistema.",
    manager_heading_title: "Lounge Operativa",
    manager_heading_intro: "Coordina le operazioni quotidiane dell'hotel, i servizi per gli ospiti, la pulizia delle camere e il team.",
    staff_heading_title: "Servizi Ospiti e Reception",
    staff_heading_intro: "Accoglienza rapida, check-in e check-out veloci e disponibilità camere in tempo reale.",
    customer_heading_title: "La Tua Esperienza Ospite",
    customer_heading_intro: "Benvenuto a MOM'S KID HOTEL. Visualizza le tue prenotazioni ed esplora le suite disponibili.",
    tab_overview: "Panoramica",
    tab_rooms: "Camere e Suite",
    tab_bookings: "Prenotazioni",
    tab_users: "Account Attivi",
    tab_deleted_users: "Account Archiviati",
    tab_audit: "Audit e Sicurezza",
    tab_backups: "Backup Crittografati",
    tab_catalog: "Esplora e Prenota",
    tab_profile: "Account e Sicurezza",
    tab_frontdesk: "Reception e Check-in",
    tab_customers: "Elenco Clienti",
    tab_team: "Membri del Team",
    tab_my_stays: "I Miei Soggiorni",
    metric_total_rooms: "Camere Totali",
    metric_occupied_rooms: "Camere Occupate",
    metric_confirmed_stays: "Soggiorni Confermati",
    metric_in_house: "Ospiti Presenti",
    metric_active_users: "Utenti Attivi",
    metric_archived_users: "Utenti Archiviati",
    metric_upcoming_stays: "Prossimi Arrivi",
    metric_staff_members: "Personale",
    metric_pending_checkins: "Check-in in Attesa",
    metric_rooms_cleaning: "Camere in Pulizia",
    metric_2fa_status: "Sicurezza 2FA",
    metric_active: "Attiva",
    sec_quick_ops: "Operazioni Rapide",
    sec_recent_reservations: "Prenotazioni Recenti",
    sec_room_directory: "Elenco Camere e Disponibilità",
    sec_all_reservations: "Tutte le Prenotazioni Ospiti",
    sec_active_accounts: "Elenco Account Attivi",
    sec_create_account: "Crea Nuovo Account Staff, Manager o Cliente",
    sec_deleted_archive: "Archivio Account Eliminati (Audit Storico Permanente)",
    sec_audit_log: "Log di Audit e Attività di Sicurezza",
    sec_encrypted_backups: "Backup Crittografati del Database",
    sec_todays_arrivals: "Arrivi di Oggi e Reception",
    sec_room_inventory: "Inventario Camere e Stato di Pulizia",
    sec_guest_reservations: "Prenotazioni Ospiti",
    sec_team_directory: "Elenco del Personale",
    sec_add_staff: "Aggiungi Staff o Cliente",
    sec_operational_audit: "Attività di Audit Operativo",
    sec_quick_queue: "Coda di Check-in e Partenze",
    sec_live_availability: "Disponibilità Camere in Tempo Reale",
    sec_reservations_directory: "Elenco Prenotazioni",
    sec_customer_directory: "Clienti Registrati",
    sec_your_reservations: "Le Tue Prenotazioni",
    sec_available_rooms: "Camere e Suite Disponibili",
    sec_account_credentials: "Credenziali e Accesso Account",
    quick_view_reservations: "Vedi Tutte le Prenotazioni",
    quick_manage_rooms: "Gestisci Inventario Camere",
    quick_create_account: "Crea Nuovo Account",
    quick_view_archive: "Visualizza Archivio Eliminati",
    btn_explore_rooms: "Esplora Camere e Prenota",
    search_accounts_placeholder: "Filtra account per e-mail o ruolo…",
    hint_active_users: "utenti attivi totali",
    empty_accounts: "Nessun account trovato.",
    th_id: "ID",
    th_email: "E-mail",
    th_role: "Ruolo / Accesso",
    th_created: "Data Creazione",
    th_actions: "Azioni",
    hint_protected_admin: "Amministratore protetto",
    btn_archive_delete: "Archivia ed Elimina",
    btn_save: "Salva",
    search_deleted_placeholder: "Cerca account eliminati…",
    hint_archived_accounts: "account archiviati",
    empty_deleted_archive: "Nessun account nell'archivio eliminati. Quando un admin elimina un utente, la cronologia viene conservata qui.",
    th_archive_num: "Archivio #",
    th_orig_id: "ID Originale",
    th_orig_role: "Ruolo Originale",
    th_deleted_at: "Eliminato il",
    th_deleted_by: "Eliminato da",
    th_reason: "Motivazione",
    search_rooms_placeholder: "Cerca camere per numero, tipologia, servizi…",
    btn_add_room: "+ Aggiungi Nuova Camera",
    th_room_num: "Camera #",
    th_room_type: "Tipologia",
    th_price_night: "Prezzo / Notte",
    th_capacity: "Capacità",
    th_amenities: "Servizi e Comfort",
    th_status: "Stato",
    btn_change_status: "Modifica Stato",
    btn_delete: "Elimina",
    search_bookings_placeholder: "Cerca per rif. prenotazione, nome ospite o camera…",
    hint_reservations: "prenotazioni",
    empty_bookings: "Nessuna prenotazione registrata finora.",
    th_booking_ref: "Riferimento",
    th_guest_contact: "Nome Ospite e Contatto",
    th_room: "Camera",
    th_dates: "Date",
    th_total_price: "Prezzo Totale",
    btn_checkin: "Check-In",
    btn_checkout: "Check-Out",
    btn_cancel: "Annulla Prenotazione",
    btn_reserve_room: "Prenota Camera",
    price_per_night: "/ notte",
    guests_suffix: "ospiti",
    search_audit_placeholder: "Cerca nel registro di sicurezza…",
    empty_audit: "Nessuna attività registrata finora.",
    th_audit_action: "Azione Evento",
    th_audit_actor_subject: "Autore e Soggetto",
    th_audit_datetime: "Data e Ora",
    field_temp_password: "Password provvisoria",
    field_entity: "Ruolo",
    hint_temp_password: "Minimo 12 caratteri. L'account dovrà verificare l'e-mail al primo accesso.",
    btn_create_account_submit: "Crea account",
    btn_trigger_backup: "Esegui Backup Crittografato Ora",
    backup_desc_auto: "Gli snapshot crittografati locali vengono eseguiti automaticamente ogni 24 ore.",
    backup_cloud_enabled: "Copia di backup cloud online AWS S3 abilitata.",
    backup_cloud_disabled: "Backup crittografati locali attivi. Per abilitare le copie cloud, configura AWS S3.",
    modal_book_title: "Prenota Camera {number}",
    modal_book_name: "Nome e Cognome dell'Ospite",
    modal_book_email: "Indirizzo E-mail dell'Ospite",
    modal_book_phone: "Numero di Telefono (facoltativo)",
    modal_book_checkin: "Data di Check-in",
    modal_book_checkout: "Data di Check-out",
    modal_book_guests: "Numero di Ospiti",
    modal_book_requests: "Richieste Speciali (facoltativo)",
    modal_book_submit: "Conferma e Prenota",
    modal_add_room_title: "Aggiungi Nuova Camera",
    modal_room_num: "Numero Camera",
    modal_room_type: "Tipo Camera / Titolo",
    modal_price_night: "Prezzo per Notte ($)",
    modal_capacity: "Capacità Massima",
    modal_amenities: "Servizi e Comfort",
    modal_initial_status: "Stato Iniziale",
    modal_desc: "Descrizione",
    modal_create_room_submit: "Crea Camera",
    modal_edit_status_title: "Aggiorna Stato Camera {number}",
    modal_select_new_status: "Seleziona Nuovo Stato Camera",
    modal_update_status_submit: "Aggiorna Stato Camera",
    modal_delete_user_title: "Archivia ed Elimina Account",
    modal_delete_user_prompt: "Sei sicuro di voler eliminare definitivamente l'account {role} di {email}?",
    modal_delete_archive_guarantee: "Garanzia di Archiviazione Permanente:",
    modal_delete_archive_info: "Questo account verrà rimosso dagli accessi attivi, tutte le sessioni e i codici OTP pendenti saranno invalidati, e un record permanente sarà conservato nell'Archivio Eliminati con data e ora.",
    modal_delete_reason: "Motivo dell'Eliminazione",
    modal_delete_submit: "Archivia ed Elimina Definitivamente",
    modal_cancel: "Annulla",
    status_available: "Disponibile",
    status_occupied: "Occupata",
    status_cleaning: "In Pulizia",
    status_maintenance: "In Manutenzione",
    status_confirmed: "confermata",
    status_checked_in: "check-in effettuato",
    status_checked_out: "check-out effettuato",
    status_cancelled: "annullata",
    label_registered_email: "E-mail Registrata",
    msg_passwords_mismatch: "Le password non coincidono.",
    toast_lang_set: "Lingua impostata su {lang}",
    toast_time_set: "Formato ora impostato su {format}",
    toast_prefs_restored: "Preferenze di sistema ripristinate ai valori predefiniti.",
  },

  ru: {
    hero_guest_eyebrow: "ВПЕЧАТЛЕНИЯ В MOM'S KID HOTEL",
    hero_guest_title: "Добро пожаловать в ваш второй дом.",
    hero_guest_caption: "Искреннее гостеприимство, внимание к деталям и отдых, который запомнится навсегда.",
    hero_admin_eyebrow: "ЛЮКС ГЕНЕРАЛЬНОГО УПРАВЛЯЮЩЕГО",
    hero_admin_title: "Весь отель как на ладони.",
    hero_admin_caption: "Единый центр управления персоналом, показателями, безопасностью и высокими стандартами сервиса.",
    hero_manager_eyebrow: "ОПЕРАЦИОННЫЙ ЦЕНТР",
    hero_manager_title: "Безупречный отдых начинается здесь.",
    hero_manager_caption: "Координируйте команду и управляйте обслуживанием гостей уверенно и с заботой.",
    hero_staff_eyebrow: "СЛУЖБА ПРИЕМА И РАЗМЕЩЕНИЯ",
    hero_staff_title: "Каждая деталь имеет значение.",
    hero_staff_caption: "Удобное рабочее место держит список гостей под рукой и сохраняет традиции гостеприимства.",
    hero_customer_eyebrow: "ВАШ ЛИЧНЫЙ КАБИНЕТ ГОСТЯ",
    hero_customer_title: "Ваш отдых, созданный для вас.",
    hero_customer_caption: "Уютное пространство для просмотра бронирований, чтобы вы чувствовали себя как дома еще до приезда.",
    pref_restore: "Сбросить настройки",
    pref_restore_title: "Восстановить системные настройки (тема, режим отображения, формат времени, язык) без изменения данных",
    pref_restore_confirm: "Сбросить системные настройки (режим отображения, язык, формат времени) к заводским параметрам?\n\n(Примечание: Все учетные записи, номера и бронирования останутся в полной сохранности.)",
    mode_auto: "Автоматический режим",
    mode_light: "Светлая тема",
    mode_dark: "Темная тема",
    time_12h: "12-часовой формат",
    time_24h: "24-часовой формат",
    role_guest: "Гость",
    role_staff: "Сотрудник",
    role_manager: "Менеджер",
    role_admin: "Администратор",
    role_title_admin: "Администратор отеля",
    role_title_manager: "Операционный менеджер отеля",
    role_title_staff: "Сотрудник службы приема",
    role_title_customer: "Уважаемый гость отеля",
    login_eyebrow: "Вход для гостей и сотрудников",
    login_title: "С возвращением.",
    login_intro: "Вход в портал MOM'S KID HOTEL. Выберите тип учетной записи и введите учетные данные.",
    login_2fa_badge: "Двухфакторная аутентификация (2FA) активна для защиты аккаунта.",
    login_demo_title: "Демо-режим: Мгновенный код 2FA активен",
    login_demo_desc: "Отправка реальных писем не настроена. Ваш 6-значный проверочный код отобразится прямо на экране.",
    field_account_type: "Тип учетной записи",
    field_email: "Электронная почта",
    field_password: "Пароль",
    btn_show: "Показать",
    btn_hide: "Скрыть",
    remember_device: "Запомнить это устройство",
    forgot_password: "Забыли пароль?",
    btn_signin: "Войти в портал",
    new_guest_prompt: "Впервые в MOM'S KID HOTEL?",
    btn_create_account: "Зарегистрировать аккаунт гостя",
    forgot_eyebrow: "Восстановление доступа",
    forgot_title: "Сброс пароля.",
    forgot_intro: "Введите адрес электронной почты, указанный при регистрации. Мы отправим код сброса, действующий 10 минут.",
    btn_send_reset: "Отправить код сброса",
    btn_back_login: "Вернуться к входу",
    reset_eyebrow: "Безопасный сброс пароля",
    reset_title: "Создание нового пароля.",
    reset_intro: "Введите шестизначный код сброса и задайте новый пароль длиной не менее 12 символов.",
    reset_demo_title: "Мгновенный код сброса (Демо-режим)",
    btn_autofill: "⚡ Вставить код автоматически",
    field_reset_code: "Код сброса пароля",
    field_new_password: "Новый пароль",
    field_confirm_password: "Подтвердите новый пароль",
    placeholder_min12: "Не менее 12 символов",
    placeholder_reenter: "Повторите новый пароль",
    btn_update_password: "Обновить пароль",
    register_eyebrow: "Регистрация гостя",
    register_title: "Создайте свою учетную запись.",
    register_intro: "Присоединяйтесь к числу гостей MOM'S KID HOTEL. Бронируйте номера и управляйте поездками с легкостью.",
    field_create_password: "Придумайте пароль",
    btn_register_submit: "Создать аккаунт гостя",
    otp_eyebrow: "Двухфакторная аутентификация",
    otp_title: "Подтверждение личности.",
    otp_intro: "Шестизначный код безопасности отправлен на {dest}. Пожалуйста, проверьте почту (включая папку «Спам») и введите его ниже.",
    otp_demo_title: "Мгновенный код 2FA (Демо-режим)",
    field_otp_code: "Введите 6-значный код",
    btn_verify_enter: "Подтвердить и войти",
    btn_resend_code: "Отправить код повторно",
    otp_hint_title: "Не получили код?",
    otp_hint_spam: "Пожалуйста, проверьте папку «Спам» или «Нежелательная почта».",
    otp_hint_terminal: "При локальной разработке 6-значный код также выводится в консоль сервера.",
    btn_logout: "Выйти",
    admin_heading_title: "Люкс генерального управляющего",
    admin_heading_intro: "Полный контроль над операциями отеля, номерным фондом, бронированиями, пользователями и безопасностью.",
    manager_heading_title: "Операционный центр отеля",
    manager_heading_intro: "Координация ежедневной работы, служба размещения, статус уборки номеров и персонал.",
    staff_heading_title: "Служба приема и размещения",
    staff_heading_intro: "Быстрое оформление заезда и выезда, мониторинг доступности и уборки номеров.",
    customer_heading_title: "Ваш личный кабинет гостя",
    customer_heading_intro: "Добро пожаловать в MOM'S KID HOTEL. Просматривайте ваши бронирования и выбирайте номера для отдыха.",
    tab_overview: "Обзор",
    tab_rooms: "Номера и люксы",
    tab_bookings: "Бронирования",
    tab_users: "Активные пользователи",
    tab_deleted_users: "Архив удаленных",
    tab_audit: "Аудит и безопасность",
    tab_backups: "Резервные копии",
    tab_catalog: "Каталог номеров",
    tab_profile: "Профиль и безопасность",
    tab_frontdesk: "Ресепшн и заезд",
    tab_customers: "Каталог гостей",
    tab_team: "Команда отеля",
    tab_my_stays: "Мои поездки",
    metric_total_rooms: "Всего номеров",
    metric_occupied_rooms: "Занято номеров",
    metric_confirmed_stays: "Подтвержденных броней",
    metric_in_house: "Гостей в отеле",
    metric_active_users: "Активных пользователей",
    metric_archived_users: "В архиве",
    metric_upcoming_stays: "Ожидаемых заездов",
    metric_staff_members: "Сотрудников",
    metric_pending_checkins: "Ожидают заезда",
    metric_rooms_cleaning: "На уборке",
    metric_2fa_status: "Безопасность 2FA",
    metric_active: "Активна",
    sec_quick_ops: "Быстрые действия",
    sec_recent_reservations: "Недавние бронирования",
    sec_room_directory: "Справочник номеров и доступность",
    sec_all_reservations: "Все бронирования гостей",
    sec_active_accounts: "Список активных учетных записей",
    sec_create_account: "Создать учетную запись сотрудника, менеджера или гостя",
    sec_deleted_archive: "Архив удаленных учетных записей (постоянный аудит)",
    sec_audit_log: "Журнал аудита и безопасности",
    sec_encrypted_backups: "Зашифрованные резервные копии БД",
    sec_todays_arrivals: "Сегодняшние заезды и ресепшн",
    sec_room_inventory: "Номерной фонд и статус чистоты",
    sec_guest_reservations: "Бронирования гостей",
    sec_team_directory: "Список сотрудников",
    sec_add_staff: "Добавить сотрудника или гостя",
    sec_operational_audit: "Операционный аудит",
    sec_quick_queue: "Очередь заезда и выезда",
    sec_live_availability: "Доступность номеров в реальном времени",
    sec_reservations_directory: "Журнал бронирований",
    sec_customer_directory: "Зарегистрированные гости",
    sec_your_reservations: "Ваши бронирования",
    sec_available_rooms: "Доступные номера и люксы",
    sec_account_credentials: "Учетные данные и права доступа",
    quick_view_reservations: "Смотреть все бронирования",
    quick_manage_rooms: "Управление номерами",
    quick_create_account: "Создать новый аккаунт",
    quick_view_archive: "Просмотреть архив удаленных",
    btn_explore_rooms: "Выбрать номер и забронировать",
    search_accounts_placeholder: "Поиск по email или роли…",
    hint_active_users: "активных пользователей",
    empty_accounts: "Учетные записи не найдены.",
    th_id: "ID",
    th_email: "Email",
    th_role: "Роль / Доступ",
    th_created: "Создан",
    th_actions: "Действия",
    hint_protected_admin: "Защищенный администратор",
    btn_archive_delete: "Архивировать и удалить",
    btn_save: "Сохранить",
    search_deleted_placeholder: "Поиск в архиве удаленных…",
    hint_archived_accounts: "аккаунтов в архиве",
    empty_deleted_archive: "В архиве нет удаленных записей. При удалении пользователя администратором запись сохраняется здесь навсегда.",
    th_archive_num: "Архив №",
    th_orig_id: "Исходный ID",
    th_orig_role: "Исходная роль",
    th_deleted_at: "Удален в",
    th_deleted_by: "Кем удален",
    th_reason: "Причина",
    search_rooms_placeholder: "Поиск по номеру, типу, удобствам…",
    btn_add_room: "+ Добавить номер",
    th_room_num: "Номер",
    th_room_type: "Тип номера",
    th_price_night: "Цена / ночь",
    th_capacity: "Вместимость",
    th_amenities: "Удобства",
    th_status: "Статус",
    btn_change_status: "Сменить статус",
    btn_delete: "Удалить",
    search_bookings_placeholder: "Поиск по номеру брони, имени гостя или комнате…",
    hint_reservations: "броней",
    empty_bookings: "Бронирований пока нет.",
    th_booking_ref: "Номер брони",
    th_guest_contact: "Имя гостя и контакты",
    th_room: "Номер",
    th_dates: "Даты",
    th_total_price: "Итоговая цена",
    btn_checkin: "Заселить",
    btn_checkout: "Выселить",
    btn_cancel: "Отменить бронь",
    btn_reserve_room: "Забронировать",
    price_per_night: "/ ночь",
    guests_suffix: "гостей",
    search_audit_placeholder: "Поиск в журнале безопасности…",
    empty_audit: "Записей журнала пока нет.",
    th_audit_action: "Действие события",
    th_audit_actor_subject: "Инициатор и объект",
    th_audit_datetime: "Дата и время",
    field_temp_password: "Временный пароль",
    field_entity: "Категория",
    hint_temp_password: "Не менее 12 символов. При первом входе потребуется подтверждение email.",
    btn_create_account_submit: "Создать аккаунт",
    btn_trigger_backup: "Создать зашифрованный бэкап сейчас",
    backup_desc_auto: "Зашифрованные локальные снимки создаются автоматически каждые 24 часа.",
    backup_cloud_enabled: "Облачное копирование в AWS S3 включено.",
    backup_cloud_disabled: "Локальные копии активны. Для облачных копий настройте переменные AWS S3.",
    modal_book_title: "Бронирование номера {number}",
    modal_book_name: "ФИО гостя",
    modal_book_email: "Email гостя",
    modal_book_phone: "Телефон (необязательно)",
    modal_book_checkin: "Дата заезда",
    modal_book_checkout: "Дата выезда",
    modal_book_guests: "Количество гостей",
    modal_book_requests: "Особые пожелания (необязательно)",
    modal_book_submit: "Подтвердить бронирование",
    modal_add_room_title: "Добавить новый номер",
    modal_room_num: "Номер комнаты",
    modal_room_type: "Тип номера / Название",
    modal_price_night: "Цена за ночь ($)",
    modal_capacity: "Макс. вместимость",
    modal_amenities: "Удобства",
    modal_initial_status: "Начальный статус",
    modal_desc: "Описание",
    modal_create_room_submit: "Создать номер",
    modal_edit_status_title: "Обновить статус номера {number}",
    modal_select_new_status: "Выберите новый статус",
    modal_update_status_submit: "Обновить статус",
    modal_delete_user_title: "Архивировать и удалить аккаунт",
    modal_delete_user_prompt: "Вы уверены, что хотите безвозвратно удалить аккаунт {role} для {email}?",
    modal_delete_archive_guarantee: "Гарантия бессрочного архивирования:",
    modal_delete_archive_info: "Этот аккаунт будет отключен, все активные сессии и коды немедленно аннулированы, а постоянная запись с указанием вашего email и времени будет сохранена в архиве.",
    modal_delete_reason: "Причина удаления",
    modal_delete_submit: "Архивировать и удалить навсегда",
    modal_cancel: "Отмена",
    status_available: "Свободен",
    status_occupied: "Занят",
    status_cleaning: "Уборка",
    status_maintenance: "Обслуживание",
    status_confirmed: "подтверждено",
    status_checked_in: "заселен",
    status_checked_out: "выселен",
    status_cancelled: "отменено",
    label_registered_email: "Зарегистрированный email",
    msg_passwords_mismatch: "Пароли не совпадают.",
    toast_lang_set: "Язык переключен на {lang}",
    toast_time_set: "Формат времени переключен на {format}",
    toast_prefs_restored: "Системные настройки сброшены к значениям по умолчанию.",
  },

};

function t(key, params = {}) {
  const dict = i18n[currentLanguage] || i18n.en;
  let text = dict[key] !== undefined ? dict[key] : (i18n.en[key] !== undefined ? i18n.en[key] : key);
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, v);
  }
  return text;
}

function getLocale() {
  if (currentLanguage === "fr") return "fr-FR";
  if (currentLanguage === "es") return "es-ES";
  if (currentLanguage === "de") return "de-DE";
  if (currentLanguage === "zh") return "zh-CN";
  if (currentLanguage === "ja") return "ja-JP";
  if (currentLanguage === "ar") return "ar-SA";
  if (currentLanguage === "pt") return "pt-PT";
  if (currentLanguage === "it") return "it-IT";
  if (currentLanguage === "ru") return "ru-RU";
  return "en-US";
}

const roleScenes = {
  guest: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="guest-sky" x2="0" y2="1"><stop stop-color="#cadbd0"/><stop offset="1" stop-color="#668d7b"/></linearGradient></defs>
      <rect width="420" height="220" fill="url(#guest-sky)"/>
      <circle class="scene-glow" cx="326" cy="48" r="27" fill="#f4dfad"/>
      <path d="M0 133 72 99l47 29 66-53 72 52 64-42 99 47v88H0Z" fill="#527267"/>
      <path d="M0 160q75-27 147 0t143 0 130 0v60H0Z" fill="#397d7a"/>
      <path d="M0 181q80-18 155 1t143 0 122 1v37H0Z" fill="#74aaa0" opacity=".75"/>
      <g class="scene-sway" fill="#183d35">
        <path d="M34 169h8v51h-8zM17 174q-2-31 21-45 21 19 14 43-19-8-35 2ZM363 163h7v57h-7zM345 169q-1-27 21-38 18 17 12 38-17-7-33 0Z"/>
      </g>
      <path d="M177 119h82v57h-82z" fill="#eee5d2"/><path d="M169 118h98l-49-38z" fill="#a77e50"/>
      <rect x="190" y="137" width="19" height="39" fill="#718b79"/><rect x="222" y="134" width="25" height="18" fill="#a4c7bd"/>
    </svg>`,
  admin: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="admin-sky" x2="0" y2="1"><stop stop-color="#c5b895"/><stop offset="1" stop-color="#715f48"/></linearGradient></defs>
      <rect width="420" height="220" fill="url(#admin-sky)"/>
      <circle class="scene-glow" cx="333" cy="48" r="24" fill="#f3dca5"/>
      <path d="M0 158 85 99l66 54 82-94 91 93 42-38 54 36v70H0Z" fill="#4c5948"/>
      <path d="M0 175h420v45H0z" fill="#263d35"/>
      <g class="scene-sway">
        <path d="M92 132h232v77H92z" fill="#dfd4bb"/>
        <path d="M77 132h262l-131-46z" fill="#8c714d"/>
        <path d="M119 147h46v62h-46zM177 147h56v34h-56zM246 147h51v34h-51z" fill="#53685a"/>
        <path d="M187 188h37v21h-37z" fill="#9e8158"/>
      </g>
      <g fill="#ead3a0"><circle cx="121" cy="162" r="3"/><circle cx="194" cy="161" r="3"/><circle cx="263" cy="161" r="3"/></g>
      <path d="M35 220q4-39 23-49 21 16 19 49zM342 220q3-32 18-43 18 14 17 43z" fill="#314c3c"/>
    </svg>`,
  manager: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="manager-sky" x2="0" y2="1"><stop stop-color="#b5d1c0"/><stop offset="1" stop-color="#477969"/></linearGradient></defs>
      <rect width="420" height="220" fill="url(#manager-sky)"/>
      <path d="M0 168q79-53 154-2t139 0 127 4v50H0z" fill="#345e4e"/>
      <path d="M56 220V81q0-49 49-49h211q49 0 49 49v139z" fill="#d8d9c7"/>
      <path d="M77 220V82q0-29 30-29h207q30 0 30 29v138z" fill="#88a994"/>
      <path d="M95 220V89q0-19 19-19h79v150zM226 70h77q19 0 19 19v131h-96z" fill="#c8dfcd"/>
      <path d="M204 70h12v150h-12z" fill="#f0ead8"/>
      <g class="scene-sway" fill="#2d5d48">
        <path d="M39 211h8V132h-8zM17 145q0-29 25-43 20 18 16 41-18-8-41 2ZM367 211h8v-70h-8zM348 150q0-25 21-36 18 14 15 35-16-6-36 1Z"/>
      </g>
      <path d="M0 194h420v26H0z" fill="#234a40" opacity=".55"/>
    </svg>`,
  staff: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="staff-sky" x2="0" y2="1"><stop stop-color="#aecbd3"/><stop offset="1" stop-color="#547b88"/></linearGradient></defs>
      <rect width="420" height="220" fill="url(#staff-sky)"/>
      <path d="M36 0h348v178H36z" fill="#e0e4dc"/>
      <path d="M58 0h139v147H58zM218 0h143v147H218z" fill="#7597a0"/>
      <path d="M73 0h109v133H73zM234 0h111v133H234z" fill="#bed8d5"/>
      <path d="M188 0h11v147h-11zM0 177h420v43H0z" fill="#4d625f"/>
      <path d="M79 220v-43h262v43" fill="#8d775b"/>
      <g class="scene-sway">
        <path d="M144 143h130v51H144z" rx="4" fill="#f0e5ce"/>
        <path d="M135 147h148l-74-29z" fill="#b88d5e"/>
        <path d="M158 157h111v8H158z" fill="#718c7e"/>
        <path d="M201 167h17v27h-17z" fill="#8b6544"/>
      </g>
      <g class="scene-glow" fill="#f4dba7"><circle cx="91" cy="22" r="4"/><circle cx="314" cy="22" r="4"/></g>
    </svg>`,
  customer: `
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="customer-sky" x2="0" y2="1"><stop stop-color="#f0d6b5"/><stop offset="1" stop-color="#c88967"/></linearGradient></defs>
      <rect width="420" height="220" fill="url(#customer-sky)"/>
      <circle class="scene-glow" cx="301" cy="55" r="31" fill="#fff0c9"/>
      <path d="M47 0h198v151H47z" fill="#f3ebda"/><path d="M62 15h168v121H62z" fill="#719796"/>
      <path d="M146 15h8v121h-8zM62 73h168v8H62z" fill="#eee2ca"/>
      <path d="M0 159h420v61H0z" fill="#7f5c49"/>
      <path d="M78 141h260v66H78z" fill="#f0e6d4"/>
      <path d="M90 129h92q14 0 14 15v25H90z" fill="#b4c8b8"/>
      <path d="M201 156h149v50H201z" fill="#d8c3a1"/>
      <path d="M77 201h268v19H77z" fill="#604637"/>
      <g class="scene-sway" fill="#446b56">
        <path d="M365 160h8v60h-8zM344 169q-1-26 24-38 18 17 13 37-16-7-37 1Z"/>
        <path d="M30 174h7v46h-7zM13 178q-1-23 21-34 16 14 12 33-14-6-33 1Z"/>
      </g>
      <path d="M250 0h170v220H250z" fill="#443832" opacity=".08"/>
    </svg>`,
};

function getHeroPresentation(role = "guest") {
  const norm = roleScenes[role] ? role : "guest";
  return {
    eyebrow: t(`hero_${norm}_eyebrow`),
    title: t(`hero_${norm}_title`),
    caption: t(`hero_${norm}_caption`),
    scene: roleScenes[norm] || roleScenes.guest,
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function api(url, body, method = "POST") {
  const options = { method, credentials: "same-origin", headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function showToast(message, type = "success") {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast-notification toast--${type}`;
  toast.innerHTML = `<span>✓</span><span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function updateHeroRole(role) {
  selectedLoginRole = role;
  const loginPage = document.querySelector(".login-page");
  const panelEyebrow = document.querySelector("[data-hero-eyebrow]") || document.querySelector(".visual-copy p");
  const panelTitle = document.querySelector("[data-hero-title]") || document.querySelector(".visual-copy h1");
  const panelCaption = document.querySelector("[data-hero-caption]");
  const panelScene = document.querySelector("[data-hero-scene]");
  const presentation = getHeroPresentation(role);

  if (loginPage) loginPage.dataset.role = role;
  if (panelEyebrow) panelEyebrow.textContent = presentation.eyebrow;
  if (panelTitle) panelTitle.textContent = presentation.title;
  if (panelCaption) panelCaption.textContent = presentation.caption;
  if (panelScene) panelScene.innerHTML = presentation.scene;
}

function showScreen(markup, wide = false, role = "") {
  const heroRole = role || (wide && currentUser ? currentUser.role : selectedLoginRole) || "guest";
  updateHeroRole(heroRole);
  if (formContent) formContent.classList.toggle("wide", wide);
  if (appView) {
    appView.innerHTML = markup;
    appView.setAttribute("aria-busy", "false");
  }
}

function messageMarkup(message = "", kind = "error") {
  return `<p class="message ${message ? kind : ""}" data-message role="status" aria-live="polite">${escapeHtml(message)}</p>`;
}

function setMessage(form, message, kind = "error") {
  const target = form.querySelector("[data-message]");
  if (target) {
    target.textContent = message;
    target.className = `message ${kind}`;
  }
}

// -----------------------------------------------------------------------------
// Preferences & Multilingual Display Controller
// -----------------------------------------------------------------------------

function applyMode(mode) {
  if (mode === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.body.classList.add("theme-dark");
  } else if (mode === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.remove("theme-dark");
  } else {
    const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("theme-dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("theme-dark");
    }
  }
}

function applyLanguage(lang) {
  if (!i18n[lang]) lang = "en";
  currentLanguage = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem("mkh_lang", lang);
  } catch {}

  const langSelect = document.querySelector("#pref-lang-select");
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }

  const restoreBtn = document.querySelector("#btn-restore-preferences");
  if (restoreBtn) {
    restoreBtn.innerHTML = `<span aria-hidden="true">🔄</span> ${t("pref_restore")}`;
    restoreBtn.title = t("pref_restore_title");
  }

  const modeSelect = document.querySelector("#pref-mode-select");
  if (modeSelect) {
    const opts = modeSelect.options;
    if (opts[0]) opts[0].textContent = t("mode_auto");
    if (opts[1]) opts[1].textContent = t("mode_light");
    if (opts[2]) opts[2].textContent = t("mode_dark");
  }

  const timeSelect = document.querySelector("#pref-time-select");
  if (timeSelect) {
    const opts = timeSelect.options;
    if (opts[0]) opts[0].textContent = t("time_12h");
    if (opts[1]) opts[1].textContent = t("time_24h");
  }

  updateHeroRole(currentUser ? currentUser.role : selectedLoginRole);
  renderCurrentScreen();
}

function renderCurrentScreen() {
  if (currentScreen === "login") {
    renderLogin(...lastScreenArgs);
  } else if (currentScreen === "forgot-password") {
    renderForgotPassword(...lastScreenArgs);
  } else if (currentScreen === "reset-password") {
    renderResetPassword(...lastScreenArgs);
  } else if (currentScreen === "register") {
    renderRegister(...lastScreenArgs);
  } else if (currentScreen === "email-code") {
    renderEmailCode(...lastScreenArgs);
  } else if (currentScreen === "dashboard" && currentUser && currentDashboardData) {
    renderDashboard(currentUser, currentDashboardData);
  }
}

async function initPreferences() {
  const modeSelect = document.querySelector("#pref-mode-select");
  const langSelect = document.querySelector("#pref-lang-select");
  const timeSelect = document.querySelector("#pref-time-select");
  const restoreBtn = document.querySelector("#btn-restore-preferences");

  let initialLang = "en";
  try {
    const res = await api("/api/preferences", undefined, "GET");
    const prefs = res.preferences || { theme: "emerald", mode: "auto", language: "en", time_format: "12h" };
    if (modeSelect) modeSelect.value = prefs.mode || "auto";
    if (langSelect) langSelect.value = prefs.language || "en";
    if (timeSelect) timeSelect.value = prefs.time_format || "12h";
    applyMode(prefs.mode || "auto");
    initialLang = prefs.language || (typeof localStorage !== "undefined" && localStorage.getItem("mkh_lang")) || "en";
  } catch (err) {
    applyMode("auto");
    initialLang = (typeof localStorage !== "undefined" && localStorage.getItem("mkh_lang")) || "en";
  }
  applyLanguage(initialLang);

  if (modeSelect) {
    modeSelect.addEventListener("change", async (e) => {
      const mode = e.target.value;
      applyMode(mode);
      try {
        await api("/api/preferences", { mode }, "PATCH");
      } catch {}
    });
  }

  if (langSelect) {
    const handleLangChange = async (e) => {
      const language = e.target.value;
      const currentEmail = document.querySelector("#email")?.value || "";
      applyLanguage(language);
      if (currentScreen === "login") {
        const emailInput = document.querySelector("#email");
        if (emailInput && currentEmail) emailInput.value = currentEmail;
      }
      try {
        await api("/api/preferences", { language }, "PATCH");
        showToast(t("toast_lang_set", { lang: e.target.options[e.target.selectedIndex].text }));
      } catch {}
    };
    langSelect.addEventListener("change", handleLangChange);
    langSelect.addEventListener("input", handleLangChange);
  }

  if (timeSelect) {
    timeSelect.addEventListener("change", async (e) => {
      const time_format = e.target.value;
      try {
        await api("/api/preferences", { time_format }, "PATCH");
        showToast(t("toast_time_set", { format: time_format }));
        if (currentUser && currentDashboardData) {
          renderDashboard(currentUser, currentDashboardData);
        }
      } catch {}
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(t("pref_restore_confirm"));
      if (!confirmed) return;

      try {
        const result = await api("/api/preferences/restore", {});
        if (modeSelect) modeSelect.value = "auto";
        if (langSelect) langSelect.value = "en";
        if (timeSelect) timeSelect.value = "12h";
        applyMode("auto");
        applyLanguage("en");
        showToast(t("toast_prefs_restored"));
        if (currentUser && currentDashboardData) {
          renderDashboard(currentUser, currentDashboardData);
        }
      } catch (err) {
        alert("Could not restore preferences: " + err.message);
      }
    });
  }
}

// -----------------------------------------------------------------------------
// Authentication Screens (Modern, User-Friendly Luxury Boutique Design)
// -----------------------------------------------------------------------------

function renderLogin(message = "", authStatus = cachedAuthStatus) {
  currentScreen = "login";
  lastScreenArgs = [message, authStatus];
  if (authStatus && typeof authStatus === "object") {
    cachedAuthStatus = authStatus;
  }
  const isDemo = cachedAuthStatus.demoMode || cachedAuthStatus.emailVerificationConfigured === false;
  updateHeroRole(selectedLoginRole);

  showScreen(`
    <p class="eyebrow">${t("login_eyebrow")}</p>
    <h2 id="login-title">${t("login_title")}</h2>
    <p class="intro">${t("login_intro")}</p>

    <div class="role-selector-bar" role="radiogroup" aria-label="${t("field_account_type")}">
      <button type="button" class="role-pill ${selectedLoginRole === "customer" ? "active" : ""}" data-role-select="customer">
        <span class="role-pill-icon">🏨</span>
        <span>${t("role_guest")}</span>
      </button>
      <button type="button" class="role-pill ${selectedLoginRole === "staff" ? "active" : ""}" data-role-select="staff">
        <span class="role-pill-icon">🛎️</span>
        <span>${t("role_staff")}</span>
      </button>
      <button type="button" class="role-pill ${selectedLoginRole === "manager" ? "active" : ""}" data-role-select="manager">
        <span class="role-pill-icon">💼</span>
        <span>${t("role_manager")}</span>
      </button>
      <button type="button" class="role-pill ${selectedLoginRole === "admin" ? "active" : ""}" data-role-select="admin">
        <span class="role-pill-icon">👑</span>
        <span>${t("role_admin")}</span>
      </button>
    </div>

    
      <div style="display:flex; align-items:center; gap:8px; margin: 12px 0 20px; padding: 9px 12px; background: var(--green-light); border-radius:8px; font-size:12.5px; color:var(--green); font-weight:600;">
        <span>🛡️</span>
        <span>${t("login_2fa_badge")}</span>
      </div>

    <form data-form="login">
      <div class="field" style="display:none;">
        <label for="role">${t("field_account_type")}</label>
        <select id="role" name="role" required>
          <option value="customer" ${selectedLoginRole === "customer" ? "selected" : ""}>${t("role_guest")}</option>
          <option value="staff" ${selectedLoginRole === "staff" ? "selected" : ""}>${t("role_staff")}</option>
          <option value="manager" ${selectedLoginRole === "manager" ? "selected" : ""}>${t("role_manager")}</option>
          <option value="admin" ${selectedLoginRole === "admin" ? "selected" : ""}>${t("role_admin")}</option>
        </select>
      </div>
      <div class="field">
        <label for="email">${t("field_email")}</label>
        <input id="email" name="email" type="email" placeholder="e.g. you@example.com" autocomplete="username" required maxlength="254">
      </div>
      <div class="field">
        <label for="password">${t("field_password")}</label>
        <div class="input-wrap">
          <input class="password-input" id="password" name="password" type="password" autocomplete="current-password" required maxlength="128" placeholder="••••••••••••">
          <button class="show-password" type="button" data-action="toggle-password" aria-controls="password" aria-pressed="false">${t("btn_show")}</button>
        </div>
      </div>
      <div class="form-options">
        <label class="remember" for="remember"><input id="remember" name="remember" type="checkbox"><span>${t("remember_device")}</span></label>
        <button class="text-button" type="button" data-action="forgot-password">${t("forgot_password")}</button>
      </div>
      <button class="submit" type="submit">${t("btn_signin")}</button>
      ${messageMarkup(message)}
    </form>
    <div style="margin-top:28px; padding-top:20px; border-top:1px solid var(--line); text-align:center;">
      <p class="signup-prompt" style="margin:0 0 8px;">${t("new_guest_prompt")}</p>
      <button class="button-secondary" style="width:100%;" type="button" data-action="register">${t("btn_create_account")}</button>
    </div>
  `);
}

function renderForgotPassword(message = "") {
  currentScreen = "forgot-password";
  lastScreenArgs = [message];
  showScreen(`
    <p class="eyebrow">${t("forgot_eyebrow")}</p>
    <h2 id="login-title">${t("forgot_title")}</h2>
    <p class="intro">${t("forgot_intro")}</p>
    <form data-form="forgot-password">
      <div class="field">
        <label for="recovery-email">${t("field_email")}</label>
        <input id="recovery-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required maxlength="254">
      </div>
      <button class="submit" type="submit" style="margin-top:20px;">${t("btn_send_reset")}</button>
      ${messageMarkup(message)}
      <button class="button-secondary" style="margin-top:12px; width:100%;" type="button" data-action="back-login">${t("btn_back_login")}</button>
    </form>
  `);
}

function renderResetPassword(message = "", demoCode = "") {
  currentScreen = "reset-password";
  lastScreenArgs = [message, demoCode];
  showScreen(`
    <p class="eyebrow">${t("reset_eyebrow")}</p>
    <h2 id="login-title">${t("reset_title")}</h2>
    <p class="intro">${t("reset_intro")}</p>

    ${demoCode ? `
      <div class="demo-code-banner">
        <span class="eyebrow" style="margin:0;">${t("reset_demo_title")}</span>
        <span class="demo-code-val">${escapeHtml(demoCode)}</span>
        <button type="button" class="btn-autofill-code" data-code="${escapeHtml(demoCode)}">${t("btn_autofill")}</button>
      </div>
    ` : ""}

    <form data-form="reset-password">
      <div class="field">
        <label for="reset-code">${t("field_reset_code")}</label>
        <input class="code-input code-input-large" id="reset-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" value="" placeholder="••••••" required>
      </div>
      <div class="field">
        <label for="new-password">${t("field_new_password")}</label>
        <input id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required placeholder="${t("placeholder_min12")}">
      </div>
      <div class="field">
        <label for="confirm-new-password">${t("field_confirm_password")}</label>
        <input id="confirm-new-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required placeholder="${t("placeholder_reenter")}">
      </div>
      <button class="submit" type="submit" style="margin-top:20px;">${t("btn_update_password")}</button>
      ${messageMarkup(message)}
      <button class="button-secondary" style="margin-top:12px; width:100%;" type="button" data-action="back-login">${t("btn_back_login")}</button>
    </form>
  `);
  appView.querySelector("#reset-code")?.focus();
}

function renderRegister(message = "") {
  currentScreen = "register";
  lastScreenArgs = [message];
  showScreen(`
    <p class="eyebrow">${t("register_eyebrow")}</p>
    <h2 id="login-title">${t("register_title")}</h2>
    <p class="intro">${t("register_intro")}</p>
    <form data-form="register">
      <div class="field">
        <label for="register-email">${t("field_email")}</label>
        <input id="register-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required maxlength="254">
      </div>
      <div class="field">
        <label for="register-password">${t("field_create_password")}</label>
        <input id="register-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required placeholder="${t("placeholder_min12")}">
      </div>
      <div class="field">
        <label for="register-confirm-password">${t("field_confirm_password")}</label>
        <input id="register-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required placeholder="${t("placeholder_reenter")}">
      </div>
      <button class="submit" type="submit" style="margin-top:20px;">${t("btn_register_submit")}</button>
      ${messageMarkup(message)}
      <button class="button-secondary" style="margin-top:12px; width:100%;" type="button" data-action="back-login">${t("btn_back_login")}</button>
    </form>
  `);
}

function renderEmailCode(destination, message = "") {
  currentScreen = "email-code";
  lastScreenArgs = [destination, message];
  showScreen(`
    <p class="eyebrow">${t("otp_eyebrow")}</p>
    <h2 id="login-title">${t("otp_title")}</h2>
    <p class="intro">${t("otp_intro", { dest: `<strong>${escapeHtml(destination)}</strong>` })}</p>

    <form data-form="email-code">
      <div class="field">
        <label for="email-code">${t("field_otp_code")}</label>
        <input class="code-input code-input-large" id="email-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" value="" placeholder="••••••" required autofocus>
      </div>
      <div class="form-options">
        <label class="remember" for="remember"><input id="remember" name="remember" type="checkbox" ${rememberSession ? "checked" : ""}><span>${t("remember_device")}</span></label>
      </div>
      <button class="submit" type="submit">${t("btn_verify_enter")}</button>
      ${messageMarkup(message)}
      <button class="button-secondary" style="margin-top:10px; width:100%;" type="button" data-action="resend-code">🔄 ${t("btn_resend_code")}</button>
      <button class="button-secondary" style="margin-top:8px; width:100%;" type="button" data-action="back-login">${t("btn_back_login")}</button>
    </form>

    <div style="margin-top:16px; padding:12px; background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.07); border-radius:8px; font-size:12px; color:var(--text-muted); line-height:1.5;">
      <strong>${t("otp_hint_title")}</strong>
      <ul style="margin:6px 0 0 16px; padding:0;">
        <li>${t("otp_hint_spam")}</li>
        <li>${t("otp_hint_terminal")}</li>
      </ul>
    </div>
  `);
  appView.querySelector("#email-code")?.focus();
}

function section(title, content) {
  return `<section class="dashboard-section" aria-label="${escapeHtml(title)}"><h3>${escapeHtml(title)}</h3>${content}</section>`;
}

// -----------------------------------------------------------------------------
// Interactive Tables & Dashboard Components
// -----------------------------------------------------------------------------

function renderTabs(tabs) {
  return `
    <nav class="tab-nav" role="tablist">
      ${tabs.map((tab) => `
        <button class="tab-btn ${activeTab === tab.id ? "active" : ""}" type="button" role="tab" data-tab="${escapeHtml(tab.id)}" aria-selected="${activeTab === tab.id}">
          ${tab.icon ? `${tab.icon} ` : ""}${escapeHtml(tab.label)}
        </button>
      `).join("")}
    </nav>
  `;
}

function renderAccountRows(users, canChangeRoles) {
  const roles = ["admin", "manager", "staff", "customer"];
  if (!users.length) return `<p class="empty-state">${t("empty_accounts")}</p>`;
  return `
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="search" class="table-search" placeholder="${t("search_accounts_placeholder")}" data-search-target="#accounts-table">
      </div>
      <span class="hint">${users.length} ${t("hint_active_users")}</span>
    </div>
    <div class="table-responsive">
      <table class="data-table" id="accounts-table">
        <thead>
          <tr>
            <th>${t("th_id")}</th>
            <th>${t("th_email")}</th>
            <th>${t("th_role")}</th>
            <th>${t("th_created")}</th>
            ${canChangeRoles ? `<th>${t("th_actions")}</th>` : ""}
          </tr>
        </thead>
        <tbody>
          ${users.map((record) => `
            <tr>
              <td><strong>#${escapeHtml(record.id)}</strong></td>
              <td>${escapeHtml(record.email)}</td>
              <td>
                ${canChangeRoles ? `
                  <form data-form="change-role" data-user-id="${escapeHtml(record.id)}" style="display:inline-flex; align-items:center; gap:6px;">
                    <select class="user-role" name="role">
                      ${roles.map((r) => `<option value="${r}" ${record.role === r ? "selected" : ""}>${escapeHtml(t("role_" + (r === "customer" ? "guest" : r))) || escapeHtml(r)}</option>`).join("")}
                    </select>
                    <button class="btn-action" type="submit">${t("btn_save")}</button>
                  </form>
                ` : `<span class="badge badge--role">${escapeHtml(t("role_" + (record.role === "customer" ? "guest" : record.role))) || escapeHtml(record.role)}</span>`}
              </td>
              <td><small>${escapeHtml(new Date(record.created_at || Date.now()).toLocaleDateString(getLocale()))}</small></td>
              ${canChangeRoles ? `
                <td>
                  ${record.role === "admin"
                    ? `<span class="hint" style="font-size:11px;">${t("hint_protected_admin")}</span>`
                    : `<button class="btn-action btn-action--danger" type="button" data-action="delete-user" data-user-id="${escapeHtml(record.id)}" data-user-email="${escapeHtml(record.email)}" data-user-role="${escapeHtml(record.role)}">${t("btn_archive_delete")}</button>`}
                </td>
              ` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDeletedUsersTable(deletedUsers) {
  if (!deletedUsers || !deletedUsers.length) {
    return `<p class="empty-state">${t("empty_deleted_archive")}</p>`;
  }
  return `
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="search" class="table-search" placeholder="${t("search_deleted_placeholder")}" data-search-target="#deleted-users-table">
      </div>
      <span class="hint">${deletedUsers.length} ${t("hint_archived_accounts")}</span>
    </div>
    <div class="table-responsive">
      <table class="data-table" id="deleted-users-table">
        <thead>
          <tr>
            <th>${t("th_archive_num")}</th>
            <th>${t("th_orig_id")}</th>
            <th>${t("th_email")}</th>
            <th>${t("th_orig_role")}</th>
            <th>${t("th_deleted_at")}</th>
            <th>${t("th_deleted_by")}</th>
            <th>${t("th_reason")}</th>
          </tr>
        </thead>
        <tbody>
          ${deletedUsers.map((u) => `
            <tr>
              <td>#${escapeHtml(u.id)}</td>
              <td>#${escapeHtml(u.original_user_id)}</td>
              <td><strong>${escapeHtml(u.email)}</strong></td>
              <td><span class="badge badge--role">${escapeHtml(t("role_" + (u.role === "customer" ? "guest" : u.role))) || escapeHtml(u.role)}</span></td>
              <td><small>${escapeHtml(new Date(u.deleted_at).toLocaleString(getLocale()))}</small></td>
              <td>${escapeHtml(u.deleted_by_email)}</td>
              <td><em>${escapeHtml(u.reason || "Deleted by administrator")}</em></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoomsDirectory(rooms, userRole) {
  const canManage = userRole === "admin" || userRole === "manager";
  return `
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="search" class="table-search" placeholder="${t("search_rooms_placeholder")}" data-search-target="#rooms-table">
      </div>
      ${canManage ? `<button class="button-secondary" type="button" data-action="open-add-room-modal">${t("btn_add_room")}</button>` : ""}
    </div>
    <div class="table-responsive">
      <table class="data-table" id="rooms-table">
        <thead>
          <tr>
            <th>${t("th_room_num")}</th>
            <th>${t("th_room_type")}</th>
            <th>${t("th_price_night")}</th>
            <th>${t("th_capacity")}</th>
            <th>${t("th_amenities")}</th>
            <th>${t("th_status")}</th>
            ${canManage ? `<th>${t("th_actions")}</th>` : ""}
          </tr>
        </thead>
        <tbody>
          ${rooms.map((room) => `
            <tr>
              <td><strong>Room ${escapeHtml(room.room_number)}</strong></td>
              <td>${escapeHtml(room.room_type)}</td>
              <td><strong>$${escapeHtml(Number(room.price_per_night).toFixed(2))}</strong></td>
              <td>${escapeHtml(room.capacity)} ${t("guests_suffix")}</td>
              <td><small>${escapeHtml(room.amenities)}</small></td>
              <td>
                <span class="badge badge--${escapeHtml(room.status)}">${escapeHtml(t("status_" + room.status) || room.status)}</span>
              </td>
              ${canManage ? `
                <td>
                  <button class="btn-action" type="button" data-action="edit-room-status" data-room-id="${escapeHtml(room.id)}" data-room-status="${escapeHtml(room.status)}" data-room-number="${escapeHtml(room.room_number)}">${t("btn_change_status")}</button>
                  ${userRole === "admin" ? `<button class="btn-action btn-action--danger" type="button" data-action="delete-room" data-room-id="${escapeHtml(room.id)}" data-room-number="${escapeHtml(room.room_number)}">${t("btn_delete")}</button>` : ""}
                </td>
              ` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderBookingsTable(bookings, userRole) {
  if (!bookings || !bookings.length) {
    return `<p class="empty-state">${t("empty_bookings")}</p>`;
  }
  const isCustomer = userRole === "customer";
  return `
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="search" class="table-search" placeholder="${t("search_bookings_placeholder")}" data-search-target="#bookings-table">
      </div>
      <span class="hint">${bookings.length} ${t("hint_reservations")}</span>
    </div>
    <div class="table-responsive">
      <table class="data-table" id="bookings-table">
        <thead>
          <tr>
            <th>${t("th_booking_ref")}</th>
            ${!isCustomer ? `<th>${t("th_guest_contact")}</th>` : ""}
            <th>${t("th_room")}</th>
            <th>${t("th_dates")}</th>
            <th>${t("th_total_price")}</th>
            <th>${t("th_status")}</th>
            <th>${t("th_actions")}</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map((b) => `
            <tr>
              <td><strong>${escapeHtml(b.booking_reference)}</strong></td>
              ${!isCustomer ? `
                <td>
                  <strong>${escapeHtml(b.guest_name)}</strong><br>
                  <small>${escapeHtml(b.guest_email)}${b.guest_phone ? ` · ${escapeHtml(b.guest_phone)}` : ""}</small>
                </td>
              ` : ""}
              <td>
                <strong>Room ${escapeHtml(b.room_number || b.room_id)}</strong><br>
                <small>${escapeHtml(b.room_type || "")}</small>
              </td>
              <td>
                <small>${escapeHtml(b.check_in_date)} &rarr; ${escapeHtml(b.check_out_date)}</small><br>
                <small>${escapeHtml(b.num_guests)} ${t("guests_suffix")}</small>
              </td>
              <td><strong>$${escapeHtml(Number(b.total_price).toFixed(2))}</strong></td>
              <td><span class="badge badge--${escapeHtml(b.status)}">${escapeHtml(t("status_" + b.status.replace("-", "_")) || b.status)}</span></td>
              <td>
                ${userRole !== "customer" ? `
                  ${b.status === "confirmed" ? `<button class="btn-action btn-action--success" type="button" data-action="update-booking-status" data-booking-id="${escapeHtml(b.id)}" data-status="checked-in">${t("btn_checkin")}</button>` : ""}
                  ${b.status === "checked-in" ? `<button class="btn-action btn-action--success" type="button" data-action="update-booking-status" data-booking-id="${escapeHtml(b.id)}" data-status="checked-out">${t("btn_checkout")}</button>` : ""}
                  ${b.status === "confirmed" ? `<button class="btn-action btn-action--danger" type="button" data-action="update-booking-status" data-booking-id="${escapeHtml(b.id)}" data-status="cancelled">${t("btn_cancel")}</button>` : ""}
                ` : `
                  ${b.status === "confirmed" ? `<button class="btn-action btn-action--danger" type="button" data-action="update-booking-status" data-booking-id="${escapeHtml(b.id)}" data-status="cancelled">${t("btn_cancel")}</button>` : `<span class="hint">—</span>`}
                `}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoomCardsGrid(rooms) {
  return `
    <div class="room-grid">
      ${rooms.map((room) => `
        <article class="room-card" data-room-id="${escapeHtml(room.id)}">
          <div class="room-card-header">
            <span class="room-card-number">Room ${escapeHtml(room.room_number)}</span>
            <span class="badge badge--${escapeHtml(room.status)}">${escapeHtml(t("status_" + room.status) || room.status)}</span>
          </div>
          <div class="room-card-body">
            <h4 class="room-card-title">${escapeHtml(room.room_type)}</h4>
            <p class="room-card-desc">${escapeHtml(room.description || "Thoughtfully curated guest suite with modern comfort.")}</p>
            <p class="room-amenities"><strong>${t("th_amenities")}:</strong> ${escapeHtml(room.amenities)}</p>
            <div class="room-card-meta">
              <span class="room-card-price">$${escapeHtml(Number(room.price_per_night).toFixed(2))} <small>${t("price_per_night")}</small></span>
              ${room.status === "available"
                ? `<button class="button-secondary" type="button" data-action="open-book-modal" data-room-id="${escapeHtml(room.id)}" data-room-number="${escapeHtml(room.room_number)}" data-room-type="${escapeHtml(room.room_type)}" data-room-price="${escapeHtml(room.price_per_night)}">${t("btn_reserve_room")}</button>`
                : `<span class="hint">${escapeHtml(t("status_" + room.status) || room.status)}</span>`}
            </div>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAuditRows(events) {
  if (!events.length) return `<p class="empty-state">${t("empty_audit")}</p>`;
  return `
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="search" class="table-search" placeholder="${t("search_audit_placeholder")}" data-search-target="#audit-table">
      </div>
    </div>
    <div class="table-responsive">
      <table class="data-table" id="audit-table">
        <thead>
          <tr>
            <th>${t("th_audit_action")}</th>
            <th>${t("th_audit_actor_subject")}</th>
            <th>${t("th_audit_datetime")}</th>
          </tr>
        </thead>
        <tbody>
          ${events.map((e) => `
            <tr>
              <td><strong>${escapeHtml(e.action.replaceAll("_", " "))}</strong></td>
              <td>${escapeHtml(e.actor_email || "System")} &middot; <small>${escapeHtml(e.subject)}</small></td>
              <td><small>${escapeHtml(new Date(e.created_at).toLocaleString(getLocale()))}</small></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCreateAccount(canCreateManagers) {
  const roles = canCreateManagers ? ["manager", "staff", "customer"] : ["staff", "customer"];
  return `<form class="inline-form" data-form="create-user">
    <div class="field"><label for="new-email">${t("field_email")}</label><input id="new-email" name="email" type="email" autocomplete="off" required maxlength="254"></div>
    <div class="field"><label for="new-password">${t("field_temp_password")}</label><input id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><p class="hint">${t("hint_temp_password")}</p></div>
    <div class="field"><label for="new-role">${t("field_entity")}</label><select id="new-role" name="role">${roles.map((role) => `<option value="${role}">${escapeHtml(t("role_" + (role === "customer" ? "guest" : role))) || escapeHtml(role)}</option>`).join("")}</select></div>
    <button class="button-secondary" type="submit">${t("btn_create_account_submit")}</button>${messageMarkup()}
  </form>`;
}

// -----------------------------------------------------------------------------
// Dashboard Rendering by Role
// -----------------------------------------------------------------------------

function renderDashboard(user, data) {
  currentScreen = "dashboard";
  lastScreenArgs = [user, data];
  currentUser = user;
  currentDashboardData = data;
  const users = data.users || [];
  const rooms = data.rooms || [];
  const bookings = data.bookings || [];
  const deletedUsers = data.deletedUsers || [];
  const role = user.role;

  const roleName = t(`role_title_${role}`) || "Hotel Account";

  const greeting = `
    <div class="dashboard-top">
      <div>
        <p class="eyebrow">${escapeHtml(roleName)}</p>
        <strong>${escapeHtml(user.email)}</strong>
      </div>
      <button class="button-secondary" type="button" data-action="logout">${t("btn_logout")}</button>
    </div>
  `;

  let title = "MOM'S KID HOTEL";
  let intro = "Hospitality management and guest services portal.";
  let content = "";

  // 1. ADMIN DASHBOARD
  if (role === "admin") {
    title = t("admin_heading_title");
    intro = t("admin_heading_intro");

    const adminTabs = [
      { id: "overview", label: t("tab_overview"), icon: "📊" },
      { id: "rooms", label: t("tab_rooms"), icon: "🛏️" },
      { id: "bookings", label: t("tab_bookings"), icon: "📅" },
      { id: "users", label: t("tab_users"), icon: "👥" },
      { id: "deleted-users", label: t("tab_deleted_users"), icon: "🗄️" },
      { id: "audit", label: t("tab_audit"), icon: "🛡️" },
      { id: "backups", label: t("tab_backups"), icon: "💾" },
    ];

    if (!adminTabs.some((t) => t.id === activeTab)) activeTab = "overview";

    let tabBody = "";
    if (activeTab === "overview") {
      const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
      const checkedInBookings = bookings.filter((b) => b.status === "checked-in").length;

      tabBody = `
        <div class="metric-row">
          <div class="metric"><span>${rooms.length}</span><small>${t("metric_total_rooms")}</small></div>
          <div class="metric"><span>${occupiedRooms}</span><small>${t("metric_occupied_rooms")}</small></div>
          <div class="metric"><span>${confirmedBookings}</span><small>${t("metric_confirmed_stays")}</small></div>
          <div class="metric"><span>${checkedInBookings}</span><small>${t("metric_in_house")}</small></div>
          <div class="metric"><span>${users.length}</span><small>${t("metric_active_users")}</small></div>
          <div class="metric"><span>${deletedUsers.length}</span><small>${t("metric_archived_users")}</small></div>
        </div>
        ${section(t("sec_quick_ops"), `
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button class="button-secondary" type="button" data-action="switch-tab" data-target-tab="bookings">${t("quick_view_reservations")}</button>
            <button class="button-secondary" type="button" data-action="switch-tab" data-target-tab="rooms">${t("quick_manage_rooms")}</button>
            <button class="button-secondary" type="button" data-action="switch-tab" data-target-tab="users">${t("quick_create_account")}</button>
            <button class="button-secondary" type="button" data-action="switch-tab" data-target-tab="deleted-users">${t("quick_view_archive")}</button>
          </div>
        `)}
        ${section(t("sec_recent_reservations"), renderBookingsTable(bookings.slice(0, 5), "admin"))}
      `;
    } else if (activeTab === "rooms") {
      tabBody = section(t("sec_room_directory"), renderRoomsDirectory(rooms, "admin"));
    } else if (activeTab === "bookings") {
      tabBody = section(t("sec_all_reservations"), renderBookingsTable(bookings, "admin"));
    } else if (activeTab === "users") {
      tabBody = `
        ${section(t("sec_active_accounts"), renderAccountRows(users, true))}
        ${section(t("sec_create_account"), renderCreateAccount(true))}
      `;
    } else if (activeTab === "deleted-users") {
      tabBody = section(t("sec_deleted_archive"), renderDeletedUsersTable(deletedUsers));
    } else if (activeTab === "audit") {
      tabBody = section(t("sec_audit_log"), renderAuditRows(data.events || []));
    } else if (activeTab === "backups") {
      tabBody = section(t("sec_encrypted_backups"), `
        <p class="backup-status">
          ${escapeHtml(data.backup?.lastBackupAt ? `Last encrypted snapshot: ${new Date(data.backup.lastBackupAt).toLocaleString(getLocale())}` : t("backup_desc_auto"))}<br>
          ${data.backup?.cloudEnabled ? t("backup_cloud_enabled") : t("backup_cloud_disabled")}
        </p>
        <button class="button-secondary" type="button" data-action="backup">${t("btn_trigger_backup")}</button>
        ${messageMarkup()}
      `);
    }

    content = `${renderTabs(adminTabs)}${tabBody}`;

  // 2. MANAGER DASHBOARD
  } else if (role === "manager") {
    title = t("manager_heading_title");
    intro = t("manager_heading_intro");

    const managerTabs = [
      { id: "overview", label: t("tab_overview"), icon: "📊" },
      { id: "rooms", label: t("tab_rooms"), icon: "🛏️" },
      { id: "bookings", label: t("tab_bookings"), icon: "📅" },
      { id: "team", label: t("tab_team"), icon: "👥" },
      { id: "audit", label: t("tab_audit"), icon: "🛡️" },
    ];

    if (!managerTabs.some((t) => t.id === activeTab)) activeTab = "overview";

    let tabBody = "";
    if (activeTab === "overview") {
      const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
      tabBody = `
        <div class="metric-row metric-row--manager">
          <div class="metric"><span>${rooms.length}</span><small>${t("metric_total_rooms")}</small></div>
          <div class="metric"><span>${occupiedRooms}</span><small>${t("metric_occupied_rooms")}</small></div>
          <div class="metric"><span>${confirmedBookings}</span><small>${t("metric_upcoming_stays")}</small></div>
          <div class="metric"><span>${users.filter((u) => u.role === "staff").length}</span><small>${t("metric_staff_members")}</small></div>
        </div>
        ${section(t("sec_todays_arrivals"), renderBookingsTable(bookings.slice(0, 5), "manager"))}
      `;
    } else if (activeTab === "rooms") {
      tabBody = section(t("sec_room_inventory"), renderRoomsDirectory(rooms, "manager"));
    } else if (activeTab === "bookings") {
      tabBody = section(t("sec_guest_reservations"), renderBookingsTable(bookings, "manager"));
    } else if (activeTab === "team") {
      tabBody = `
        ${section(t("sec_team_directory"), renderAccountRows(users.filter((account) => account.role !== "admin"), false))}
        ${section(t("sec_add_staff"), renderCreateAccount(false))}
      `;
    } else if (activeTab === "audit") {
      tabBody = section(t("sec_operational_audit"), renderAuditRows(data.events || []));
    }

    content = `${renderTabs(managerTabs)}${tabBody}`;

  // 3. STAFF DASHBOARD
  } else if (role === "staff") {
    title = t("staff_heading_title");
    intro = t("staff_heading_intro");

    const staffTabs = [
      { id: "overview", label: t("tab_frontdesk"), icon: "🛎️" },
      { id: "rooms", label: t("tab_rooms"), icon: "🛏️" },
      { id: "bookings", label: t("tab_bookings"), icon: "📅" },
      { id: "customers", label: t("tab_customers"), icon: "👥" },
    ];

    if (!staffTabs.some((t) => t.id === activeTab)) activeTab = "overview";

    let tabBody = "";
    if (activeTab === "overview") {
      const inHouse = bookings.filter((b) => b.status === "checked-in");
      const arrivals = bookings.filter((b) => b.status === "confirmed");
      tabBody = `
        <div class="metric-row metric-row--staff">
          <div class="metric"><span>${arrivals.length}</span><small>${t("metric_pending_checkins")}</small></div>
          <div class="metric"><span>${inHouse.length}</span><small>${t("metric_in_house")}</small></div>
          <div class="metric"><span>${rooms.filter((r) => r.status === "cleaning").length}</span><small>${t("metric_rooms_cleaning")}</small></div>
          <div class="metric"><span>${t("metric_active")}</span><small>${t("metric_2fa_status")}</small></div>
        </div>
        ${section(t("sec_quick_queue"), renderBookingsTable(bookings, "staff"))}
      `;
    } else if (activeTab === "rooms") {
      tabBody = section(t("sec_live_availability"), renderRoomsDirectory(rooms, "staff"));
    } else if (activeTab === "bookings") {
      tabBody = section(t("sec_reservations_directory"), renderBookingsTable(bookings, "staff"));
    } else if (activeTab === "customers") {
      const customerRows = (data.customers || []).map((c) => `
        <li>
          <span>${escapeHtml(c.email)}<small>Customer #${escapeHtml(c.id)}</small></span>
          <span class="badge badge--role">${t("role_guest")}</span>
        </li>
      `).join("");
      tabBody = section(t("sec_customer_directory"), `<ul class="data-list">${customerRows || "<li>No customer records yet.</li>"}</ul>`);
    }

    content = `${renderTabs(staffTabs)}${tabBody}`;

  // 4. CUSTOMER / GUEST DASHBOARD
  } else {
    title = t("customer_heading_title");
    intro = t("customer_heading_intro");

    const customerTabs = [
      { id: "overview", label: t("tab_my_stays"), icon: "🧳" },
      { id: "catalog", label: t("tab_catalog"), icon: "🏨" },
      { id: "profile", label: t("tab_profile"), icon: "👤" },
    ];

    if (!customerTabs.some((t) => t.id === activeTab)) activeTab = "overview";

    let tabBody = "";
    if (activeTab === "overview") {
      tabBody = `
        ${section(t("sec_your_reservations"), renderBookingsTable(bookings, "customer"))}
        <div style="margin-top:20px;">
          <button class="button-secondary" type="button" data-action="switch-tab" data-target-tab="catalog">${t("btn_explore_rooms")}</button>
        </div>
      `;
    } else if (activeTab === "catalog") {
      tabBody = section(t("sec_available_rooms"), renderRoomCardsGrid(rooms));
    } else if (activeTab === "profile") {
      tabBody = `
        <div class="customer-summary">
          <p class="eyebrow">${t("label_registered_email")}</p>
          <strong>${escapeHtml(user.email)}</strong>
          <p>${t("login_2fa_badge")}</p>
        </div>
        ${section(t("sec_account_credentials"), `
          <ul class="data-list">
            <li><span>${t("field_account_type")}</span><span class="badge badge--role">${t("role_guest")}</span></li>
            <li><span>${t("metric_2fa_status")}</span><span class="badge badge--available">${t("metric_active")}</span></li>
            <li><span>Security Pepper &amp; Salts</span><span>scrypt-derived</span></li>
          </ul>
        `)}
      `;
    }

    content = `${renderTabs(customerTabs)}${tabBody}`;
  }

  showScreen(`
    ${greeting}
    <div class="screen-heading">
      <p class="eyebrow">MOM'S KID HOTEL</p>
      <h2 id="login-title">${escapeHtml(title)}</h2>
      <p class="intro">${escapeHtml(intro)}</p>
    </div>
    ${content}
  `, true, role);

  setupTableSearchListeners();
}

function setupTableSearchListeners() {
  const searchInputs = appView.querySelectorAll(".table-search");
  searchInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const targetTableId = e.target.dataset.searchTarget;
      if (!targetTableId) return;
      const table = document.querySelector(targetTableId);
      if (!table) return;
      const rows = table.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  });
}

// -----------------------------------------------------------------------------
// Interactive Modals (Booking, Room Management, Deletion Confirmation)
// -----------------------------------------------------------------------------

function openModal(contentHtml) {
  if (!modalContainer) return;
  modalContainer.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content" role="dialog" aria-modal="true">
        ${contentHtml}
      </div>
    </div>
  `;
  modalContainer.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modalContainer) return;
  modalContainer.innerHTML = "";
  modalContainer.setAttribute("aria-hidden", "true");
}

function openBookRoomModal(roomId, roomNumber, roomType, pricePerNight) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);
  const dayAfterStr = dayAfter.toISOString().slice(0, 10);

  openModal(`
    <div class="modal-header">
      <h3>${t("modal_book_title", { number: escapeHtml(roomNumber) })}</h3>
      <button class="btn-close" type="button" data-action="close-modal">&times;</button>
    </div>
    <p class="hint"><strong>${escapeHtml(roomType)}</strong> &middot; $${escapeHtml(Number(pricePerNight).toFixed(2))} ${t("price_per_night")}</p>
    <form data-form="create-booking" style="margin-top:16px;">
      <input type="hidden" name="room_id" value="${escapeHtml(roomId)}">
      <div class="field">
        <label for="modal-guest-name">${t("modal_book_name")}</label>
        <input id="modal-guest-name" name="guest_name" type="text" value="${escapeHtml(currentUser?.email ? currentUser.email.split("@")[0] : "")}" required>
      </div>
      ${currentUser?.role !== "customer" ? `
        <div class="field">
          <label for="modal-guest-email">${t("modal_book_email")}</label>
          <input id="modal-guest-email" name="guest_email" type="email" required>
        </div>
      ` : ""}
      <div class="field">
        <label for="modal-guest-phone">${t("modal_book_phone")}</label>
        <input id="modal-guest-phone" name="guest_phone" type="tel" placeholder="+1 (555) 000-0000">
      </div>
      <div class="field" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label for="modal-checkin">${t("modal_book_checkin")}</label>
          <input id="modal-checkin" name="check_in_date" type="date" value="${tomorrowStr}" required>
        </div>
        <div>
          <label for="modal-checkout">${t("modal_book_checkout")}</label>
          <input id="modal-checkout" name="check_out_date" type="date" value="${dayAfterStr}" required>
        </div>
      </div>
      <div class="field">
        <label for="modal-guests">${t("modal_book_guests")}</label>
        <input id="modal-guests" name="num_guests" type="number" min="1" max="10" value="2" required>
      </div>
      <div class="field">
        <label for="modal-requests">${t("modal_book_requests")}</label>
        <input id="modal-requests" name="special_requests" type="text" placeholder="e.g. Quiet room, late arrival, baby crib">
      </div>
      <button class="submit" type="submit" style="margin-top:20px;">${t("modal_book_submit")}</button>
      ${messageMarkup()}
    </form>
  `);
}

function openAddRoomModal() {
  openModal(`
    <div class="modal-header">
      <h3>${t("modal_add_room_title")}</h3>
      <button class="btn-close" type="button" data-action="close-modal">&times;</button>
    </div>
    <form data-form="create-room">
      <div class="field">
        <label for="modal-room-number">${t("modal_room_num")}</label>
        <input id="modal-room-number" name="room_number" type="text" placeholder="e.g. 402" required>
      </div>
      <div class="field">
        <label for="modal-room-type">${t("modal_room_type")}</label>
        <input id="modal-room-type" name="room_type" type="text" placeholder="e.g. Executive Balcony Suite" required>
      </div>
      <div class="field" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div>
          <label for="modal-price">${t("modal_price_night")}</label>
          <input id="modal-price" name="price_per_night" type="number" step="0.01" min="1" value="180.00" required>
        </div>
        <div>
          <label for="modal-capacity">${t("modal_capacity")}</label>
          <input id="modal-capacity" name="capacity" type="number" min="1" max="12" value="2" required>
        </div>
      </div>
      <div class="field">
        <label for="modal-amenities">${t("modal_amenities")}</label>
        <input id="modal-amenities" name="amenities" type="text" placeholder="King Bed, High-Speed Wi-Fi, Ocean View, Mini-Bar" required>
      </div>
      <div class="field">
        <label for="modal-room-status">${t("modal_initial_status")}</label>
        <select id="modal-room-status" name="status">
          <option value="available" selected>${t("status_available")}</option>
          <option value="cleaning">${t("status_cleaning")}</option>
          <option value="maintenance">${t("status_maintenance")}</option>
        </select>
      </div>
      <div class="field">
        <label for="modal-desc">${t("modal_desc")}</label>
        <input id="modal-desc" name="description" type="text" placeholder="Spacious room with luxury finishes.">
      </div>
      <button class="submit" type="submit" style="margin-top:18px;">${t("modal_create_room_submit")}</button>
      ${messageMarkup()}
    </form>
  `);
}

function openEditRoomStatusModal(roomId, roomNumber, currentStatus) {
  openModal(`
    <div class="modal-header">
      <h3>${t("modal_edit_status_title", { number: escapeHtml(roomNumber) })}</h3>
      <button class="btn-close" type="button" data-action="close-modal">&times;</button>
    </div>
    <form data-form="update-room-status" data-room-id="${escapeHtml(roomId)}">
      <div class="field">
        <label for="modal-status-select">${t("modal_select_new_status")}</label>
        <select id="modal-status-select" name="status">
          <option value="available" ${currentStatus === "available" ? "selected" : ""}>${t("status_available")}</option>
          <option value="occupied" ${currentStatus === "occupied" ? "selected" : ""}>${t("status_occupied")}</option>
          <option value="cleaning" ${currentStatus === "cleaning" ? "selected" : ""}>${t("status_cleaning")}</option>
          <option value="maintenance" ${currentStatus === "maintenance" ? "selected" : ""}>${t("status_maintenance")}</option>
        </select>
      </div>
      <button class="submit" type="submit" style="margin-top:18px;">${t("modal_update_status_submit")}</button>
      ${messageMarkup()}
    </form>
  `);
}

function openDeleteUserModal(userId, userEmail, userRole) {
  openModal(`
    <div class="modal-header">
      <h3 style="color:var(--coral);">${t("modal_delete_user_title")}</h3>
      <button class="btn-close" type="button" data-action="close-modal">&times;</button>
    </div>
    <p>${t("modal_delete_user_prompt", { role: `<strong>${escapeHtml(userRole)}</strong>`, email: `<strong>${escapeHtml(userEmail)}</strong>` })}</p>
    <div class="abstract" style="margin: 12px 0; font-size:12.5px;">
      <strong>${t("modal_delete_archive_guarantee")}</strong>
      ${t("modal_delete_archive_info")}
    </div>
    <form data-form="confirm-delete-user" data-user-id="${escapeHtml(userId)}">
      <div class="field">
        <label for="delete-reason">${t("modal_delete_reason")}</label>
        <input id="delete-reason" name="reason" type="text" placeholder="e.g. Employee departure, seasonal contract finished, user request" required>
      </div>
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn-action btn-action--danger" style="flex:1; padding:12px;" type="submit">${t("modal_delete_submit")}</button>
        <button class="button-secondary" type="button" data-action="close-modal">${t("modal_cancel")}</button>
      </div>
      ${messageMarkup()}
    </form>
  `);
}

// -----------------------------------------------------------------------------
// Data Fetching & App Lifecycle
// -----------------------------------------------------------------------------

async function loadDashboard(user) {
  try {
    let data = {};
    if (user.role === "admin") {
      const [directory, audit, backup, roomsRes, bookingsRes, deletedRes] = await Promise.all([
        api("/api/users", undefined, "GET"),
        api("/api/audit", undefined, "GET"),
        api("/api/backups/status", undefined, "GET"),
        api("/api/rooms", undefined, "GET"),
        api("/api/bookings", undefined, "GET"),
        api("/api/deleted-users", undefined, "GET"),
      ]);
      data = {
        users: directory.users,
        events: audit.events,
        backup,
        rooms: roomsRes.rooms,
        bookings: bookingsRes.bookings,
        deletedUsers: deletedRes.deletedUsers,
      };
    } else if (user.role === "manager") {
      const [directory, audit, roomsRes, bookingsRes] = await Promise.all([
        api("/api/users", undefined, "GET"),
        api("/api/audit", undefined, "GET"),
        api("/api/rooms", undefined, "GET"),
        api("/api/bookings", undefined, "GET"),
      ]);
      data = {
        users: directory.users,
        events: audit.events,
        rooms: roomsRes.rooms,
        bookings: bookingsRes.bookings,
      };
    } else if (user.role === "staff") {
      const [customersRes, roomsRes, bookingsRes] = await Promise.all([
        api("/api/customers", undefined, "GET"),
        api("/api/rooms", undefined, "GET"),
        api("/api/bookings", undefined, "GET"),
      ]);
      data = {
        customers: customersRes.customers,
        rooms: roomsRes.rooms,
        bookings: bookingsRes.bookings,
      };
    } else {
      const [roomsRes, bookingsRes] = await Promise.all([
        api("/api/rooms", undefined, "GET"),
        api("/api/bookings", undefined, "GET"),
      ]);
      data = {
        rooms: roomsRes.rooms,
        bookings: bookingsRes.bookings,
      };
    }
    renderDashboard(user, data);
  } catch (error) {
    if (error.status === 401) return renderLogin("Your session expired. Sign in again.");
    renderLogin(error.message);
  }
}

async function start() {
  await initPreferences();
  try {
    const result = await api("/api/auth/me", undefined, "GET");
    await loadDashboard(result.user);
  } catch (error) {
    try {
      const status = await api("/api/auth/status", undefined, "GET");
      cachedAuthStatus = status;
      renderLogin(error.status === 401 ? "" : error.message, status);
    } catch (statusError) {
      renderLogin(statusError.message, { emailVerificationConfigured: true, demoMode: true });
    }
  }
}

// -----------------------------------------------------------------------------
// Global Event Listeners (Clicks & Submissions)
// -----------------------------------------------------------------------------

document.addEventListener("click", async (event) => {
  // Role selector pill in login screen
  const rolePill = event.target.closest("button[data-role-select]");
  if (rolePill) {
    const role = rolePill.dataset.roleSelect;
    selectedLoginRole = role;
    document.querySelectorAll(".role-pill").forEach((p) => p.classList.toggle("active", p === rolePill));
    const roleSelect = document.querySelector("#role");
    if (roleSelect) roleSelect.value = role;
    updateHeroRole(role);
    return;
  }

  // Resend 2FA verification code
  if (event.target.closest("button[data-action=\"resend-code\"]")) {
    const btn = event.target.closest("button[data-action=\"resend-code\"]");
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Resending code...";
    try {
      const res = await api("/api/auth/resend-code", {});
      showToast(res.message || "New code dispatched!");
      renderEmailCode(lastScreenArgs[0] || "", res.message, res.demoCode || lastScreenArgs[2] || "");
    } catch (err) {
      showToast(err.message || "Could not resend code.", "error");
      btn.disabled = false;
      btn.textContent = oldText;
    }
    return;
  }

  // Auto-fill demo verification / reset code
  const autoFillBtn = event.target.closest(".btn-autofill-code");
  if (autoFillBtn) {
    const code = autoFillBtn.dataset.code;
    const input = document.querySelector("#email-code") || document.querySelector("#reset-code");
    if (input) {
      input.value = code;
      input.focus();
    }
    return;
  }

  const button = event.target.closest("button[data-action], button[data-tab]");
  if (!button) return;

  // Tabs
  if (button.dataset.tab) {
    activeTab = button.dataset.tab;
    if (currentUser && currentDashboardData) {
      renderDashboard(currentUser, currentDashboardData);
    }
    return;
  }
  if (button.dataset.action === "switch-tab") {
    activeTab = button.dataset.targetTab;
    if (currentUser && currentDashboardData) {
      renderDashboard(currentUser, currentDashboardData);
    }
    return;
  }

  // Password toggle
  if (button.dataset.action === "toggle-password") {
    const input = document.querySelector(`#${CSS.escape(button.getAttribute("aria-controls"))}`);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? t("btn_hide") : t("btn_show");
    button.setAttribute("aria-pressed", String(show));
    return;
  }

  // Navigation
  if (button.dataset.action === "back-login") renderLogin();
  if (button.dataset.action === "register") renderRegister();
  if (button.dataset.action === "forgot-password") renderForgotPassword();
  if (button.dataset.action === "close-modal") closeModal();

  // Logout
  if (button.dataset.action === "logout") {
    try { await api("/api/auth/logout", {}); } catch {}
    currentUser = null;
    currentDashboardData = null;
    renderLogin();
    return;
  }

  // Modal triggers
  if (button.dataset.action === "open-book-modal") {
    openBookRoomModal(button.dataset.roomId, button.dataset.roomNumber, button.dataset.roomType, button.dataset.roomPrice);
    return;
  }
  if (button.dataset.action === "open-add-room-modal") {
    openAddRoomModal();
    return;
  }
  if (button.dataset.action === "edit-room-status") {
    openEditRoomStatusModal(button.dataset.roomId, button.dataset.roomNumber, button.dataset.roomStatus);
    return;
  }
  if (button.dataset.action === "delete-user") {
    openDeleteUserModal(button.dataset.userId, button.dataset.userEmail, button.dataset.userRole);
    return;
  }

  // Delete Room
  if (button.dataset.action === "delete-room") {
    const confirmed = window.confirm(`Permanently remove Room ${button.dataset.roomNumber}?`);
    if (!confirmed) return;
    try {
      await api(`/api/rooms/${encodeURIComponent(button.dataset.roomId)}`, {}, "DELETE");
      showToast(`Room ${button.dataset.roomNumber} removed.`);
      await loadDashboard(currentUser);
    } catch (err) {
      alert(err.message);
    }
    return;
  }

  // Update Booking Status
  if (button.dataset.action === "update-booking-status") {
    const newStatus = button.dataset.status;
    const bookingId = button.dataset.bookingId;
    try {
      const res = await api(`/api/bookings/${encodeURIComponent(bookingId)}/status`, { status: newStatus }, "PATCH");
      showToast(res.message || `Booking status updated to ${newStatus}.`);
      await loadDashboard(currentUser);
    } catch (err) {
      alert(err.message);
    }
    return;
  }

  // Trigger Backup
  if (button.dataset.action === "backup") {
    button.disabled = true;
    try {
      const res = await api("/api/backups/run", {});
      showToast(res.message || "Encrypted backup created successfully.");
      await loadDashboard(currentUser);
    } catch (error) {
      button.disabled = false;
      setMessage(appView, error.message);
    }
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  const data = Object.fromEntries(new FormData(form));

  try {
    if (form.dataset.form === "login") {
      rememberSession = data.remember === "on";
      const result = await api("/api/auth/login", { email: data.email, password: data.password, role: data.role, remember: rememberSession });
      if (result.phase === "authenticated") {
        await loadDashboard(result.user);
        return;
      }
      if (result.emailDeliveryError) {
        showToast("Email delivery had an issue. Check server terminal or use instant code.", "warning");
      }
      renderEmailCode(result.destination, result.message || "", result.demoCode);
      return;
    }

    if (form.dataset.form === "email-code") {
      rememberSession = data.remember === "on";
      const result = await api("/api/auth/verify-email", { code: data.code, remember: rememberSession });
      await loadDashboard(result.user);
      return;
    }

    if (form.dataset.form === "register") {
      if (data.password !== data.confirmPassword) {
        setMessage(form, t("msg_passwords_mismatch"));
        if (submit) submit.disabled = false;
        return;
      }
      const result = await api("/api/auth/register", { email: data.email, password: data.password });
      renderLogin(result.message);
      return;
    }

    if (form.dataset.form === "forgot-password") {
      const result = await api("/api/auth/forgot-password", { email: data.email });
      renderResetPassword(result.message, result.demoCode);
      return;
    }

    if (form.dataset.form === "reset-password") {
      if (data.password !== data.confirmPassword) {
        setMessage(form, t("msg_passwords_mismatch"));
        if (submit) submit.disabled = false;
        return;
      }
      const result = await api("/api/auth/reset-password", { code: data.code, password: data.password });
      renderLogin(result.message);
      return;
    }

    if (form.dataset.form === "create-user") {
      await api("/api/users", { email: data.email, password: data.password, role: data.role });
      showToast(`Account for ${data.email} created.`);
      await loadDashboard(currentUser);
      return;
    }

    if (form.dataset.form === "change-role") {
      await api(`/api/users/${encodeURIComponent(form.dataset.userId)}/role`, { role: data.role }, "PATCH");
      showToast("Access level updated.");
      await loadDashboard(currentUser);
      return;
    }

    // Modal: Confirm Delete User with Reason
    if (form.dataset.form === "confirm-delete-user") {
      const userId = form.dataset.userId;
      await api(`/api/users/${encodeURIComponent(userId)}`, { reason: data.reason }, "DELETE");
      closeModal();
      showToast("Account permanently deleted and preserved in Deleted Accounts Archive.");
      await loadDashboard(currentUser);
      return;
    }

    // Modal: Create Booking
    if (form.dataset.form === "create-booking") {
      const bookingPayload = {
        room_id: Number(data.room_id),
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        num_guests: Number(data.num_guests),
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone,
        special_requests: data.special_requests,
      };
      const res = await api("/api/bookings", bookingPayload);
      closeModal();
      showToast(`Reservation ${res.booking.booking_reference} confirmed!`);
      activeTab = "overview";
      await loadDashboard(currentUser);
      return;
    }

    // Modal: Create Room
    if (form.dataset.form === "create-room") {
      await api("/api/rooms", {
        room_number: data.room_number,
        room_type: data.room_type,
        price_per_night: Number(data.price_per_night),
        capacity: Number(data.capacity),
        amenities: data.amenities,
        status: data.status,
        description: data.description,
      });
      closeModal();
      showToast(`Room ${data.room_number} added successfully.`);
      await loadDashboard(currentUser);
      return;
    }

    // Modal: Update Room Status
    if (form.dataset.form === "update-room-status") {
      const roomId = form.dataset.roomId;
      await api(`/api/rooms/${encodeURIComponent(roomId)}`, { status: data.status }, "PATCH");
      closeModal();
      showToast("Room status updated.");
      await loadDashboard(currentUser);
      return;
    }
  } catch (error) {
    setMessage(form, error.message);
    if (submit) submit.disabled = false;
  }
});

start();
