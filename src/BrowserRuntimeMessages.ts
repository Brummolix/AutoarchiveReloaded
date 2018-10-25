interface IBrowserMessage
{
    id:string
}

interface IBrowserMessageSendCurrentSettings extends IBrowserMessage
{
    data:ISettings;
}