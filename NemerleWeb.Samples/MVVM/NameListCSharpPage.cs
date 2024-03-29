﻿using NemerleWeb;
using System.Linq;
using System.Collections.Generic;

namespace NemerleWeb.Samples
{
  [Unit]
  partial class NameListCSharpPage
  {
    List<string> Names { get; set; }
    string SearchPattern { get; set; }    
    List<string> FilteredNames
    {
      get
      {
        if(SearchPattern == null)
          return Names;
        else
        {
          var result = new List<string>();
          foreach(var name in Names)
            if(name.ToUpper().Contains(SearchPattern.ToUpper()))
              result.Add(name);
          return result;
        }
      }
    }    
    
    public NameListCSharpPage()
    {
      server.GetNames(l => { Names = l; });
    }
    
    public class Server
    {
      public List<string> GetNames()
      {
        return Helpers.GetNames().ToList();
      }
    }
  }
}
