import { supabase } from '../lib/supabase';
import { User, Lead, Contact, Account, Deal, Task, Communication, Campaign, Notification } from '../types';

export const api = {
    // Users
    getUsers: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        // Map snake_case to camelCase
        return (data || []).map(user => ({
            ...user,
            authId: user.auth_id,
            lastLogin: user.last_login
        })) as User[];
    },

    syncUser: async (user: User) => {
        // First try to check if user exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.authId || user.id)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('users')
                .update({
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    enabled: user.enabled !== undefined ? user.enabled : true,
                    last_login: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) {
                console.error('Error updating user in public table:', error);
            }
        } else {
            // Insert new
            const { error } = await supabase
                .from('users')
                .insert({
                    auth_id: user.authId || user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    enabled: user.enabled !== undefined ? user.enabled : true,
                    last_login: new Date().toISOString()
                });

            if (error) {
                console.error('Error inserting user to public table:', error);
            }
        }
    },

    // Leads
    getLeads: async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    createLead: async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
        const dbLead = {
            ...lead,
            assigned_to: lead.assignedTo || null, // Convert empty string to null
            value: lead.value
        };
        // Remove undefined fields to let default values take over or avoid errors
        delete (dbLead as any).assignedTo;

        const { data, error } = await supabase
            .from('leads')
            .insert(dbLead)
            .select('*, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .single();

        if (error) throw error;
        return data as Lead;
    },

    updateLead: async (id: string, updates: Partial<Lead>) => {
        const dbUpdates: any = { ...updates };
        if (updates.assignedTo) {
            dbUpdates.assigned_to = updates.assignedTo;
            delete dbUpdates.assignedTo;
        }
        // Remove readonly fields
        delete dbUpdates.id;
        delete dbUpdates.createdAt;
        delete dbUpdates.updatedAt;

        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('leads')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .single();

        if (error) throw error;
        return data as Lead;
    },

    deleteLead: async (id: string) => {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Contacts
    getContacts: async () => {
        const { data, error } = await supabase
            .from('contacts')
            .select('*, firstName:first_name, lastName:last_name, accountId:account_id, createdAt:created_at, updatedAt:updated_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Contact[];
    },

    createContact: async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
        const dbContact = {
            ...contact,
            first_name: contact.firstName,
            last_name: contact.lastName,
            account_id: contact.accountId || null
        };
        delete (dbContact as any).firstName;
        delete (dbContact as any).lastName;
        delete (dbContact as any).accountId;

        const { data, error } = await supabase
            .from('contacts')
            .insert(dbContact)
            .select('*, firstName:first_name, lastName:last_name, accountId:account_id, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Contact;
    },

    updateContact: async (id: string, updates: Partial<Contact>) => {
        const dbUpdates: any = { ...updates };
        if (updates.firstName) { dbUpdates.first_name = updates.firstName; delete dbUpdates.firstName; }
        if (updates.lastName) { dbUpdates.last_name = updates.lastName; delete dbUpdates.lastName; }
        if (updates.accountId) { dbUpdates.account_id = updates.accountId; delete dbUpdates.accountId; }

        dbUpdates.updated_at = new Date().toISOString();
        delete dbUpdates.id;
        delete dbUpdates.createdAt;

        const { data, error } = await supabase
            .from('contacts')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, firstName:first_name, lastName:last_name, accountId:account_id, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Contact;
    },

    deleteContact: async (id: string) => {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
    },

    // Accounts
    getAccounts: async () => {
        const { data, error } = await supabase
            .from('accounts')
            .select('*, annualRevenue:annual_revenue, createdAt:created_at, updatedAt:updated_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Account[];
    },

    createAccount: async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
        const dbAccount = {
            ...account,
            annual_revenue: account.annualRevenue
        };
        delete (dbAccount as any).annualRevenue;

        const { data, error } = await supabase
            .from('accounts')
            .insert(dbAccount)
            .select('*, annualRevenue:annual_revenue, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Account;
    },

    updateAccount: async (id: string, updates: Partial<Account>) => {
        const dbUpdates: any = { ...updates };
        if (updates.annualRevenue) { dbUpdates.annual_revenue = updates.annualRevenue; delete dbUpdates.annualRevenue; }

        dbUpdates.updated_at = new Date().toISOString();
        delete dbUpdates.id;
        delete dbUpdates.createdAt;

        const { data, error } = await supabase
            .from('accounts')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, annualRevenue:annual_revenue, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Account;
    },

    deleteAccount: async (id: string) => {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
    },

    // Deals
    getDeals: async () => {
        const { data, error } = await supabase
            .from('deals')
            .select('*, accountId:account_id, contactId:contact_id, expectedCloseDate:expected_close_date, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as Deal[];
    },

    createDeal: async (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
        const dbDeal = {
            ...deal,
            account_id: deal.accountId || null,
            contact_id: deal.contactId || null,
            expected_close_date: deal.expectedCloseDate,
            assigned_to: deal.assignedTo || null
        };
        delete (dbDeal as any).accountId;
        delete (dbDeal as any).contactId;
        delete (dbDeal as any).expectedCloseDate;
        delete (dbDeal as any).assignedTo;

        const { data, error } = await supabase
            .from('deals')
            .insert(dbDeal)
            .select('*, accountId:account_id, contactId:contact_id, expectedCloseDate:expected_close_date, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Deal;
    },

    updateDeal: async (id: string, updates: Partial<Deal>) => {
        const dbUpdates: any = { ...updates };
        if (updates.accountId !== undefined) { dbUpdates.account_id = updates.accountId || null; delete dbUpdates.accountId; }
        if (updates.contactId !== undefined) { dbUpdates.contact_id = updates.contactId || null; delete dbUpdates.contactId; }
        if (updates.expectedCloseDate) { dbUpdates.expected_close_date = updates.expectedCloseDate; delete dbUpdates.expectedCloseDate; }
        if (updates.assignedTo !== undefined) { dbUpdates.assigned_to = updates.assignedTo || null; delete dbUpdates.assignedTo; }

        dbUpdates.updated_at = new Date().toISOString();
        delete dbUpdates.id;
        delete dbUpdates.createdAt;

        const { data, error } = await supabase
            .from('deals')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, accountId:account_id, contactId:contact_id, expectedCloseDate:expected_close_date, assignedTo:assigned_to, createdAt:created_at, updatedAt:updated_at')
            .single();
        if (error) throw error;
        return data as Deal;
    },

    deleteDeal: async (id: string) => {
        const { error } = await supabase.from('deals').delete().eq('id', id);
        if (error) throw error;
    },

    // Tasks
    getTasks: async () => {
        // Note: relatedTo is complex because it's stored as type/id. 
        // For now we just fetch the raw fields and map them to the object structure expected by Frontend if needed.
        // Frontend expects: relatedTo: { type, id }
        // DB has: related_to_type, related_to_id

        const { data, error } = await supabase
            .from('tasks')
            .select('*, dueDate:due_date, assignedTo:assigned_to, createdAt:created_at');

        if (error) throw error;

        return data.map((task: any) => ({
            ...task,
            relatedTo: task.related_to_type ? { type: task.related_to_type, id: task.related_to_id } : undefined,
            // cleanup raw fields if desired, but keeping them is fine usually
        })) as Task[];
    },

    createTask: async (task: Omit<Task, 'id' | 'createdAt'>) => {
        const dbTask = {
            ...task,
            due_date: task.dueDate,
            assigned_to: task.assignedTo || null,
            related_to_type: task.relatedTo?.type,
            related_to_id: task.relatedTo?.id || null
        };
        delete (dbTask as any).dueDate;
        delete (dbTask as any).assignedTo;
        delete (dbTask as any).relatedTo;

        const { data, error } = await supabase
            .from('tasks')
            .insert(dbTask)
            .select()
            .single();

        if (error) throw error;

        // Manual mapping for the single response
        return {
            ...data,
            dueDate: data.due_date,
            assignedTo: data.assigned_to,
            createdAt: data.created_at,
            relatedTo: data.related_to_type ? { type: data.related_to_type, id: data.related_to_id } : undefined
        } as Task;
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const dbUpdates: any = { ...updates };
        if (updates.dueDate) { dbUpdates.due_date = updates.dueDate; delete dbUpdates.dueDate; }
        if (updates.assignedTo !== undefined) { dbUpdates.assigned_to = updates.assignedTo || null; delete dbUpdates.assignedTo; }
        if (updates.relatedTo) {
            dbUpdates.related_to_type = updates.relatedTo.type;
            dbUpdates.related_to_id = updates.relatedTo.id || null;
            delete dbUpdates.relatedTo;
        }
        delete dbUpdates.id;
        delete dbUpdates.createdAt;

        const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            dueDate: data.due_date,
            assignedTo: data.assigned_to,
            createdAt: data.created_at,
            relatedTo: data.related_to_type ? { type: data.related_to_type, id: data.related_to_id } : undefined
        } as Task;
    },

    deleteTask: async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    },

    // Communications
    getCommunications: async () => {
        const { data, error } = await supabase
            .from('communications')
            .select('*, createdBy:created_by, createdAt:created_at');

        if (error) throw error;

        return data.map((comm: any) => ({
            ...comm,
            relatedTo: comm.related_to_type ? { type: comm.related_to_type, id: comm.related_to_id } : undefined
        })) as Communication[];
    },

    createCommunication: async (comm: Omit<Communication, 'id' | 'createdAt'>) => {
        const dbComm = {
            ...comm,
            created_by: comm.createdBy,
            related_to_type: comm.relatedTo?.type,
            related_to_id: comm.relatedTo?.id || null
        };
        delete (dbComm as any).createdBy;
        delete (dbComm as any).relatedTo;
        // Remove leaked fields from frontend state if present
        delete (dbComm as any).relatedToId;
        delete (dbComm as any).relatedToType;

        const { data, error } = await supabase
            .from('communications')
            .insert(dbComm)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdBy: data.created_by,
            createdAt: data.created_at,
            relatedTo: data.related_to_type ? { type: data.related_to_type, id: data.related_to_id } : undefined
        } as Communication;
    },

    updateCommunication: async (id: string, updates: Partial<Communication>) => {
        const dbUpdates: any = { ...updates };
        if (updates.relatedTo) {
            dbUpdates.related_to_type = updates.relatedTo.type;
            dbUpdates.related_to_id = updates.relatedTo.id || null;
            delete dbUpdates.relatedTo;
        }
        delete dbUpdates.id;
        delete dbUpdates.createdAt;
        delete dbUpdates.createdBy;

        // Cleanup frontend fields if they leak
        delete dbUpdates.relatedToId;
        delete dbUpdates.relatedToType;

        const { data, error } = await supabase
            .from('communications')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            createdBy: data.created_by,
            createdAt: data.created_at,
            relatedTo: data.related_to_type ? { type: data.related_to_type, id: data.related_to_id } : undefined
        } as Communication;
    },

    deleteCommunication: async (id: string) => {
        const { error } = await supabase
            .from('communications')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Campaigns
    getCampaigns: async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*, startDate:start_date, endDate:end_date, leadsGenerated:leads_generated, conversionRate:conversion_rate');

        if (error) throw error;
        return data as Campaign[];
    },

    createCampaign: async (campaign: Omit<Campaign, 'id'>) => {
        const dbCampaign = {
            ...campaign,
            start_date: campaign.startDate,
            end_date: campaign.endDate,
            leads_generated: campaign.leadsGenerated,
            conversion_rate: campaign.conversionRate
        };
        delete (dbCampaign as any).startDate;
        delete (dbCampaign as any).endDate;
        delete (dbCampaign as any).leadsGenerated;
        delete (dbCampaign as any).conversionRate;

        const { data, error } = await supabase
            .from('campaigns')
            .insert(dbCampaign)
            .select('*, startDate:start_date, endDate:end_date, leadsGenerated:leads_generated, conversionRate:conversion_rate')
            .single();

        if (error) throw error;
        return data as Campaign;
    },

    updateCampaign: async (id: string, updates: Partial<Campaign>) => {
        const dbUpdates: any = { ...updates };
        if (updates.startDate) { dbUpdates.start_date = updates.startDate; delete dbUpdates.startDate; }
        if (updates.endDate) { dbUpdates.end_date = updates.endDate; delete dbUpdates.endDate; }
        if (updates.leadsGenerated) { dbUpdates.leads_generated = updates.leadsGenerated; delete dbUpdates.leadsGenerated; }
        if (updates.conversionRate) { dbUpdates.conversion_rate = updates.conversionRate; delete dbUpdates.conversionRate; }

        delete dbUpdates.id;

        const { data, error } = await supabase
            .from('campaigns')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, startDate:start_date, endDate:end_date, leadsGenerated:leads_generated, conversionRate:conversion_rate')
            .single();

        if (error) throw error;
        return data as Campaign;
    },

    deleteCampaign: async (id: string) => {
        const { error } = await supabase.from('campaigns').delete().eq('id', id);
        if (error) throw error;
    },

    // Users (Management)




    // Admin User Management (RPCs)
    // Admin creates user via Supabase Auth (SignUp)
    // We use a separate client instance with persistSession: false to avoid logging out the admin
    adminCreateUser: async (user: { email: string; password: string; name: string; role: string }) => {
        const { data, error } = await supabase.rpc('admin_create_user', {
            p_email: user.email,
            p_password: user.password,
            p_name: user.name,
            p_role: user.role
        });

        if (error) throw error;
        return data;
    },


    adminDeleteUser: async (userId: string) => {
        const { error } = await supabase.rpc('admin_delete_user', {
            target_user_id: userId
        });
        if (error) throw error;
    },

    adminUpdateUserPassword: async (userId: string, newPassword: string) => {
        const { error } = await supabase.rpc('admin_update_password', {
            target_user_id: userId,
            new_password: newPassword
        });
        if (error) throw error;
    },

    // Legacy / Public Profile Update
    updateUser: async (id: string, updates: Partial<User>) => {
        const dbUpdates: any = { ...updates };
        if (updates.lastLogin) { dbUpdates.last_login = updates.lastLogin; delete dbUpdates.lastLogin; }

        // Remove authId if present
        delete dbUpdates.authId;

        const { data, error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return {
            ...data,
            authId: data.auth_id,
            lastLogin: data.last_login
        } as User;
    },

    // Organization Settings
    // Note: Since we are using a single row for settings, we can just fetch the first one or upsert
    getOrganizationSettings: async () => {
        const { data, error } = await supabase
            .from('organization_settings')
            .select('*, workingHoursStart:working_hours_start, workingHoursEnd:working_hours_end, companyName:company_name')
            .limit(1)
            .single();

        if (error) {
            // If no settings found, return default or null. 
            // The schema script inserts a default, so this should ideally not fail unless table is empty.
            if (error.code === 'PGRST116') return null; // JSON code for no rows found
            throw error;
        }

        return {
            companyName: data.company_name,
            currency: data.currency,
            timezone: data.timezone,
            workingHours: {
                start: data.working_hours_start,
                end: data.working_hours_end
            },
            holidays: data.holidays
        } as any; // Cast to avoid strict type mismatch if partial
    },

    updateOrganizationSettings: async (settings: any) => {
        // First get existing ID or just update where ID is not null (since there's only one row)
        // For simplicity, let's assume one row exists.

        const dbSettings = {
            company_name: settings.companyName,
            currency: settings.currency,
            timezone: settings.timezone,
            working_hours_start: settings.workingHours.start,
            working_hours_end: settings.workingHours.end,
            holidays: settings.holidays,
            updated_at: new Date().toISOString()
        };

        // We use a query that updates the single row. 
        // A robust way: fetch ID first, then update.
        const { data: existing } = await supabase.from('organization_settings').select('id').limit(1).single();

        let error;
        if (existing) {
            const { error: updateError } = await supabase
                .from('organization_settings')
                .update(dbSettings)
                .eq('id', existing.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('organization_settings')
                .insert(dbSettings);
            error = insertError;
        }

        if (error) throw error;
    },

    // Notifications
    getNotifications: async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((n: any) => ({
            ...n,
            createdAt: n.created_at
        })) as Notification[];
    },

    markNotificationRead: async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        if (error) throw error;
    },

    markAllNotificationsRead: async (userId: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);
        if (error) throw error;
    },

    deleteNotification: async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'> & { userId: string }) => {
        const dbNotification = {
            user_id: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            read: false
        };

        const { error } = await supabase
            .from('notifications')
            .insert(dbNotification);

        if (error) throw error;
    }
};
