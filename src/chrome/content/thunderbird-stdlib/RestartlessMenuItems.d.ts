
interface RestartlessMenuItemOptions
{
    id:string; //An id for the <tt>menuitem</tt>, this should be namespaced.
    label:string; // A label for the <tt>menuitem</tt>.
    url?:string; //(optional, preferred) An URL where the <tt>oncommand</tt> should navigate to.
    onCommand?:()=>void;//(optional) A function callback what the <tt>menuitem</tt>'s oncommand will call.
    accesskey?:string; //(optional) An access key for the <tt>menuitem</tt>.
    key?:string; // (optional) A shortcut key for the <tt>menuitem</tt>.
    image?:string; //(optional) An URL for the <tt>menuitem</tt>.
    onUnload?:()=>void;//(optional) A function for the <tt>menuitem</tt>, which redoes all the stuff
}

declare class RestartlessMenuItems
{
    static add(options:RestartlessMenuItemOptions):void;
    static remove(options:RestartlessMenuItemOptions, keepArray:boolean):void;
    static removeAll():void;
}
